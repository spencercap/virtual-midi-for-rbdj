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
const inputRDJ = new easymidi.Input(rbdjMidiName);
const outputRDJ = new easymidi.Output(rbdjMidiName);
// midi
const inputMidi = new easymidi.Input(controllerName);
const outputMidi = new easymidi.Output(controllerName);

// keeper
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
// const noteDebouncer = (inMsg, func) => {
//     console.log('noteDebouncer', inMsg);
//     console.log('noteDebounces', noteDebounces);

//     if (noteDebounces[inMsg.channel] && noteDebounces[inMsg.channel][inMsg.note]) {
//         console.log('too many clicks');
//         return;
//     } else {
//         // call it
//         func();
//         console.log('call it!');

//         // say we called it
//         // noteDebounces[inMsg.channel][inMsg.note] = true;
//         noteDebounces[inMsg.channel] = {
//             ...(noteDebounces[inMsg.channel] || {}),
//             [inMsg.note]: true
//         };

//         // remove it
//         setTimeout(() => {
//             delete noteDebounces[inMsg.channel][inMsg.note];

//             console.log(noteDebounces);
//         }, debounceTime);
//     }
// };

/* ------------------------------------- */
/* ------------------------------------- */
/* ------------------------------------- */

// listen for messages from rekordbox:
inputRDJ.on('cc', function (msg) {
    // console.log('inputRDJ cc', msg);

    // channel volume level 1
    if (msg.channel == 0) {
        if (msg.controller == 2) {
            // outputMidi.send

            // twitch deck A level VU meter
            // outputMidi.send('noteon', {
            //     channel: 7,
            //     note: 94,
            //     velocity: Math.floor((msg.value / 127) * 115)
            // });
        }
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

        outputRDJ.send('noteon', {
            channel: msg.channel,
            note: msg.note,
            velocity: 127
        });
    });
});

inputMidi.on('noteoff', function (msg) {
    console.log('noteoff', msg);

    noteDebouncer(msg, () => {
        console.log('sending vel 0');

        outputRDJ.send('noteon', {
            channel: msg.channel,
            note: msg.note,
            velocity: 0
        });
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
