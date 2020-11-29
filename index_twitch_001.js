// imports
var easymidi = require('easymidi'); // helpful package: https://github.com/dinchak/node-easymidi

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
// const controllerName = '4MidiLoop';
const controllerName = 'Twitch';

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
const inputVirtual = new easymidi.Input('VVV-t', true);
const outputVirtual = new easymidi.Output('VVV-t', true); // for midi mapping in DAW (dont use outputRDJ even tho that is simple - can easily create feedback loops)

// keeper for mute kills
let decks = {
    a: {
        eq: {
            low: 0,
            mid: 0,
            high: 0
        },
        cfx: {
            mode: 0, // 0, 1, 2, 3 (off, lo, off, hi)
            lo: 0,
            hi: 0
        }
    },
    b: {
        eq: {
            low: 0,
            mid: 0,
            high: 0
        },
        cfx: {
            mode: 0, // 0, 1, 2, 3 (off, lo, off, hi)
            lo: 0,
            hi: 0
        }
    },
    c: {
        eq: {
            low: 0,
            mid: 0,
            high: 0
        }
    },
    d: {
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
const rkToFfxChannel = (inChannel) => {
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

const ffxToRkChannel = (inChannel) => {
    if (inChannel == 0) {
        return 2;
    } else if (inChannel == 1) {
        return 0;
    } else if (inChannel == 2) {
        return 1;
    } else if (inChannel == 3) {
        return 3;
    }
};

const midiToChannelLetter = (inChannel) => {
    if (inChannel == 0) {
        return 'c';
    } else if (inChannel == 1) {
        return 'a';
    } else if (inChannel == 2) {
        return 'b';
    } else if (inChannel == 3) {
        return 'd';
    }
};

const twitchChannelToLetter = (inChannel) => {
    if (inChannel == 7) {
        return 'a';
    } else if (inChannel == 8) {
        return 'b';
    }
};

/* ------------------------------------- */
/* ------------------------------------- */
/* ------------------------------------- */

// listen for messages from rekordbox:
// inputRDJ.on('cc', function (msg) {
//     // console.log('inputRDJ cc', msg);

//     // ffx channel LEDS (deck, channel, cc)
//     // A: 0 52
//     // B: 1 52
//     // C: 2 52
//     // D: 3 52

//     // ffx channel level
//     if (msg.controller == 2) {
//         // covers all decks ABCD
//         outputMidi.send('cc', {
//             channel: rkToFfxChannel(msg.channel),
//             controller: 52,
//             value: returnFfxMapped(msg.value)
//         });
//     }
// });

// inputRDJ.on('noteon', function (msg) {
//     // console.log('inputRDJ noteon', msg);

//     /** LEDs */

//     // loop actives
//     if (msg.note == 20) {
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 64,
//             velocity: msg.velocity
//         });
//     }
//     // headphone cue LED
//     else if (msg.note == 84) {
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 26,
//             velocity: msg.velocity
//         });
//     }
//     // play/pause LED
//     else if (msg.note == 11) {
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             // note: 106, // Ffx Master LED for channel (below Sync)
//             note: 54, //
//             velocity: msg.velocity
//         });
//     }
// });

// inputRDJ.on('noteoff', function (msg) {
//     // console.log('inputRDJ noteoff', msg);

//     /** hotcue LEDs */
//     // hot1
//     if (msg.note == 36) {
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 36,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//         // SHIFTED
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 44,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//     }
//     // hot2
//     else if (msg.note == 37) {
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 37,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 45,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//     }
//     // hot3
//     else if (msg.note == 38) {
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 38,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 46,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//     }
//     // hot4
//     else if (msg.note == 39) {
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 39,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 47,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//     }
//     // hot5
//     else if (msg.note == 40) {
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 40,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 48,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//     }
//     // hot6
//     else if (msg.note == 41) {
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 41,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 49,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//     }
//     // hot7
//     else if (msg.note == 42) {
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 42,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 50,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//     }
//     // hot8
//     else if (msg.note == 43) {
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 43,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//         outputMidi.send('noteon', {
//             channel: rkToFfxChannel(msg.channel),
//             note: 51,
//             velocity: msg.velocity ? 127 : 0 // comes in at vel 22
//         });
//     }
// });

//
inputMidi.on('cc', function (msg) {
    console.log('cc', msg);

    // jog wheels
    // if (msg.controller == 16) {
    //     // console.log('sending JogScratch');

    //     outputRDJ.send('cc', {
    //         channel: ffxToRkChannel(msg.channel),
    //         controller: 34,
    //         value: msg.value
    //     });
    // } else if (msg.controller == 18) {
    //     // console.log('sending JogSearch');

    //     outputRDJ.send('cc', {
    //         channel: ffxToRkChannel(msg.channel),
    //         controller: 31,
    //         value: msg.value
    //     });
    // }


    // // store EQ vals for EQ kill momentary buttons
    // // high
    // if (msg.controller == 3) {
    //     decks[midiToChannelLetter(msg.channel)].eq.high = msg.value;
    // }
    // // mid
    // else if (msg.controller == 4) {
    //     decks[midiToChannelLetter(msg.channel)].eq.mid = msg.value;
    // }
    // // low
    // else if (msg.controller == 5) {
    //     decks[midiToChannelLetter(msg.channel)].eq.low = msg.value;
    // }

    // SPLIT filter
    if (msg.controller == 9) {
        if (decks[twitchChannelToLetter(msg.channel)].cfx.mode == 0) {
            decks[twitchChannelToLetter(msg.channel)].cfx.lo = msg.value;

            outputVirtual.send('cc', {
                channel: msg.channel - 7,
                controller: msg.controller,
                value: mapRange(msg.value, 0, 127, 63, 0)
            });
        } else if (decks[twitchChannelToLetter(msg.channel)].cfx.mode == 1) {
            decks[twitchChannelToLetter(msg.channel)].cfx.hi = msg.value;

            outputVirtual.send('cc', {
                channel: msg.channel - 7,
                controller: msg.controller,
                value: mapRange(msg.value, 0, 127, 64, 127)
            });
        }
        // dont send anything else in this loop
        return;
    }

    // route ALL cc through us
    outputVirtual.send('cc', {
        channel: msg.channel,
        controller: msg.controller,
        value: msg.value
    });

});

inputMidi.on('noteon', function (msg) {
    console.log('inputMidi noteon', msg);

    // filter toggle buttons
    if (msg.note == 10) {
        if (msg.velocity) {
            const newMode = (decks[twitchChannelToLetter(msg.channel)].cfx.mode + 1) % 2;
            decks[twitchChannelToLetter(msg.channel)].cfx.mode = newMode;

            outputMidi.send('noteon', {
                channel: msg.channel,
                note: msg.note,
                velocity: (newMode % 2) ? 127 : 0
            });
        }
    }

    console.log('decks', decks);

    // noteDebouncer(msg, () => {
    //     if (msg.note == 2 || msg.note == 4 || msg.note == 6) {
    //         handleEqKill(msg);
    //     } else {
    //         outputVirtual.send('noteon', {
    //             channel: msg.channel,
    //             note: msg.note,
    //             velocity: 127
    //         });
    //     }
    // });
});

// inputMidi.on('noteoff', function (msg) {
//     console.log('inputMidi noteoff', msg);

//     // noteDebouncer(msg, () => {
//     //     if (msg.note == 2 || msg.note == 4 || msg.note == 6) {
//     //         handleEqKill(msg);
//     //     } else {
//     //         outputVirtual.send('noteon', {
//     //             channel: msg.channel,
//     //             note: msg.note,
//     //             velocity: 0
//     //         });
//     //     }
//     // });
// });


//
// funcs
const handleEqKill = (inMsg) => {
    // hi
    if (inMsg.note == 2) {
        // kill it
        if (inMsg._type == 'noteon') {
            outputVirtual.send('cc', {
                channel: inMsg.channel,
                controller: 3,
                value: 0
            });
        }
        // reset to where fader was
        else if (inMsg._type == 'noteoff') {
            outputVirtual.send('cc', {
                channel: inMsg.channel,
                controller: 3,
                value: decks
                [midiToChannelLetter(inMsg.channel)]
                    .eq
                    .high
            });
        }
    }
    // mid
    else if (
        inMsg.note == 4
    ) {
        // kill it
        if (inMsg._type == 'noteon') {
            outputVirtual.send('cc', {
                channel: inMsg.channel,
                controller: 4,
                value: 0
            });
        }
        // reset to where fader was
        else if (inMsg._type == 'noteoff') {
            outputVirtual.send('cc', {
                channel: inMsg.channel,
                controller: 4,
                value: decks
                [midiToChannelLetter(inMsg.channel)]
                    .eq
                    .mid
            });
        }
    }
    // low
    else if (inMsg.note == 6) {
        // kill it
        if (inMsg._type == 'noteon') {
            outputVirtual.send('cc', {
                channel: inMsg.channel,
                controller: 5,
                value: 0
            });
        }
        // reset to where fader was
        else if (inMsg._type == 'noteoff') {
            outputVirtual.send('cc', {
                channel: inMsg.channel,
                controller: 5,
                value: decks
                [midiToChannelLetter(inMsg.channel)]
                    .eq
                    .low
            });
        }
    }
};


// clean up
process.on('exit', code => {
    console.log('\nclosing process');

    // close midi ports
    inputRDJ.close();
    outputRDJ.close();
    inputMidi.close();
    outputMidi.close();
    inputVirtual.close();
    outputVirtual.close();

    console.log('goodbye');
});
process.on('SIGINT', function () {
    process.exit();
});
