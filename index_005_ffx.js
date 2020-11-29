// imports
var easymidi = require('easymidi'); // helpful package

// help
// hexidecimal converter:
// https://www.rapidtables.com/convert/number/hex-to-decimal.html

/* ------------------------------------- */
/* ------------------------------------- */
/* ------------------------------------- */

// INIT
console.log('MIDI inputs:');
const inputs = easymidi.getInputs();
console.log(inputs);

console.log('MIDI outputs:');
const outputs = easymidi.getInputs();
console.log(outputs);

const rbdjMidiName = 'PIONEER DDJ-SX2';
const controllerName = '4MidiLoop';
// const controllerName = 'Twitch';

if (
    !inputs.includes(rbdjMidiName) ||
    !inputs.includes(controllerName) ||
    !outputs.includes(rbdjMidiName) ||
    !outputs.includes(controllerName)
) {
    console.error('incorrent inputs');
    return;
}

// rbdj
const inputRDJ = new easymidi.Input(rbdjMidiName); // messages from rkdj come in here (like VU meter)
const outputRDJ = new easymidi.Output(rbdjMidiName);
// midi
const inputMidi = new easymidi.Input(controllerName);
const outputMidi = new easymidi.Output(controllerName);
// virtual
const inputVirtual = new easymidi.Input('VVV', true);
const outputVirtual = new easymidi.Output('VVV', true); // for midi mapping in DAW (dont use outputRDJ even tho that is simple - can easily create feedback loops)

// keeper for mute kills
let decks = {
    a: {
        eq: {
            low: 0,
            mid: 0,
            high: 0
        }
    },
    b: {
        eq: {
            low: 0,
            mid: 0,
            high: 0
        }
    }
};


// util
const throttle = (func, wait) => {
    let called = false;
    return () => {
        if (!called) {
            called = true;
            setTimeout(function () {
                func();
                called = false;
            }, wait);
        }
    };
};


// vars
const noteDebounces = {
    noteon: {},
    noteoff: {}
};

/**
 *
 * @param {
 * channel: number,
 * note: number,
 * velocity: number
 *
 * timer: number} inMsg
 */
const debounceTime = 100; // ms
const noteDebouncer = (inMsg, func) => {
    // console.log('noteDebouncer', inMsg);
    // console.log('noteDebounces', noteDebounces);

    const now = new Date();
    const time = now.getTime();
    const lastNoteTime = noteDebounces[inMsg._type][inMsg.channel] && noteDebounces[inMsg._type][inMsg.channel][inMsg.note];

    if (lastNoteTime && ((time - lastNoteTime) < debounceTime)) {
        console.log('too many clicks');
        return;
    } else {
        func();
        noteDebounces[inMsg._type][inMsg.channel] = {
            ...(noteDebounces[inMsg.channel] || {}),
            [inMsg.note]: time
        };
    }
};


// helpful util from processing
const mapRange = (
    value,
    low1,
    high1,
    low2,
    high2
) => {
    return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
};


// ffx respond to 0-5
// 0 = no led
// 1 = 1 led
// 2 = 2 leds
// ...
const returnFfxMapped = (inVal) => {
    // inVal = 0 - 127
    // important vals are from 80 - 127

    // return mapRange(inVal, 0, 127, 0, 5);
    return mapRange(inVal, 85, 127, 0, 5);
}

// maps channel to how Ffx like it
const returnFfxChannel = (inChannel) => {
    if (inChannel == 0) {
        return 1;
    } else if (inChannel == 1) {
        return 2;
    } else if (inChannel == 2) {
        return 0;
    } else if (inChannel == 3) {
        return 3;
    }
};

/* ------------------------------------- */
/* ------------------------------------- */
/* ------------------------------------- */

// listen for messages from rekordbox:
inputRDJ.on('cc', function (msg) {
    // console.log('inputRDJ cc', msg);

    // ffx channel LEDS (deck, channel, cc) // value / 25 = fullness of VU meters
    // A: 0 52
    // B: 1 52
    // C: 2 52
    // D: 3 52

    // ffx channel level
    if (msg.controller == 2) {
        // covers all decks ABCD
        outputMidi.send('cc', {
            channel: returnFfxChannel(msg.channel),
            controller: 52,
            value: returnFfxMapped(msg.value)
        });

        // // A
        // // channel volume level 1
        // if (msg.channel == 0) {
        //     outputMidi.send('cc', {
        //         channel: 1,
        //         controller: 52,
        //         value: returnFfxMapped(msg.value)
        //     });
        // }

        // // B
        // if (msg.channel == 1) {
        //     outputMidi.send('cc', {
        //         channel: 2,
        //         controller: 52,
        //         value: returnFfxMapped(msg.value)
        //     });
        // }

        // // C
        // if (msg.channel == 2) {
        //     outputMidi.send('cc', {
        //         channel: 0,
        //         controller: 52,
        //         value: returnFfxMapped(msg.value)
        //     });
        // }

        // // D
        // if (msg.channel == 3) {
        //     outputMidi.send('cc', {
        //         channel: 3,
        //         controller: 52,
        //         value: returnFfxMapped(msg.value)
        //     });
        // }
    }

    // // channel volume level 2
    // if (msg.channel == 1) {
    //     if (msg.controller == 2) {
    //         // deck 2 level VU meter
    //         outputMidi.send('noteon', {
    //             channel: 8,
    //             note: 94,
    //             velocity: Math.floor((msg.value / 127) * 115)
    //         });
    //     }
    // }

    // if (msg.channel == 11) {
    //     console.log('[T-LOG]: msg', msg);
    // }

});

inputRDJ.on('noteon', function (msg) {
    console.log('inputRDJ noteon', msg);

    // loop actives
    if (msg.note == 20) {
        outputMidi.send('noteon', {
            channel: returnFfxChannel(msg.channel),
            note: 64,
            velocity: msg.velocity
        });
    }
});

inputRDJ.on('noteoff', function (msg) {
    console.log('inputRDJ noteoff', msg);
});

//
inputMidi.on('cc', function (msg) {
    console.log('cc', msg);

    // if (msg.channel == 7) {
    //     if (msg.controller == 3) {
    //         // console.log('val', msg.value);

    //         outputRDJ.send('cc', {
    //             channel: 6,
    //             controller: 64,
    //             value: msg.value,
    //         });
    //     }
    // }
});

inputMidi.on('noteon', function (msg) {
    console.log('noteon', msg);

    noteDebouncer(msg, () => {
        console.log('sending vel 127');

        // virtualInput
        outputVirtual.send('noteon', {
            channel: msg.channel,
            note: msg.note,
            velocity: 127
        });

        // outputRDJ.send('noteon', {
        //     channel: msg.channel,
        //     note: msg.note,
        //     velocity: 127
        // });
    });
});

inputMidi.on('noteoff', function (msg) {
    console.log('noteoff', msg);

    noteDebouncer(msg, () => {
        console.log('sending vel 0');

        outputVirtual.send('noteon', {
            channel: msg.channel,
            note: msg.note,
            velocity: 0
        });
        // outputRDJ.send('noteon', {
        //     channel: msg.channel,
        //     note: msg.note,
        //     velocity: 0
        // });
    });
});

// for monitoring what we send
// inputRDJ.on('noteon', (msg) => {
//     console.log('out msg', msg);
// });

// clean up
process.on('exit', code => {
    console.log('\nclosing process');
    inputRDJ.close();
    outputMidi.close();
    console.log('goodbye');
});
process.on('SIGINT', function () {
    process.exit();
});
