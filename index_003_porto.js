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

/* ------------------------------------- */
/* ------------------------------------- */
/* ------------------------------------- */

// listen for messages from rekordbox:
inputRDJ.on('cc', function (msg) {
    // console.log('[T-LOG]: msg', msg);

    // channel volume level 1
    if (msg.channel == 0) {
        if (msg.controller == 2) {
            // twitch deck A level VU meter
            outputMidi.send('noteon', {
                channel: 7,
                note: 94,
                velocity: Math.floor((msg.value / 127) * 115)
            });
        }
    }

    // channel volume level 2
    if (msg.channel == 1) {
        if (msg.controller == 2) {
            // deck 2 level VU meter
            outputMidi.send('noteon', {
                channel: 8,
                note: 94,
                velocity: Math.floor((msg.value / 127) * 115)
            });
        }
    }

    if (msg.channel == 11) {
        console.log('[T-LOG]: msg', msg);
    }

});

inputMidi.on('cc', function (msg) {
    // console.log('msg', msg);

    // A
    if (msg.channel == 7) {
        if (msg.controller == 3) {
            // console.log('val', msg.value);

            outputRDJ.send('cc', {
                channel: 6,
                controller: 64,
                value: msg.value,
            });
        }
    }

    // B
    if (msg.channel == 8) {
        if (msg.controller == 3) {
            console.log('val', msg.value);

            outputRDJ.send('cc', {
                channel: 6,
                controller: 100,
                value: msg.value,
            });
        }
    }
});

inputMidi.on('cc', function (msg) {
    console.log('[T-LOG]: msg', msg);

    // const deck = msg.channel == 7 ? 'A' : msg.channel == 8 ? 'B' : '';
    // const params = {};

    // A
    if (msg.channel == 7) {
        if (msg.controller == 71) {
            // save last val for eq kill
            decks.a.eq.mid = msg.value;
            console.log('decks', decks);

            // AND pass it on to sx2 midi map
            outputRDJ.send('cc', {
                channel: 0,
                controller: 11,
                value: msg.value,
            });
        }
    }
    // B
    else if (msg.channel == 8) {
        if (msg.controller == 71) {
            decks.b.eq.mid = msg.value;
        }
    }

});

inputMidi.on('noteon', function (msg) {
    console.log('msg', msg);

    // deck A
    if (msg.channel == 7) {
        if (msg.note == 22) {
            // triggers vel 127 for down and vel 0 for up (but ALSO triggers noteoff in reverse)
            console.log('A cue noteon velocity', msg.velocity);


            // input.on('noteon', function (params) {
            //     // params = {note: ..., velocity: ..., channel: ...}
            // });

            outputRDJ.send('noteon', {
                channel: 0,
                note: 11,
                velocity: msg.velocity
            });

            // outputMidi.send('noteon', {
            //     channel: 7,
            //     note: 22,
            //     velocity: msg.velocity
            // });

            // if (msg.velocity) {
            // }
        }
        // memontary eq kill (mid)
        else if (msg.note == 10) {

            // outputRDJ.send('cc', {
            //     channel: 0,
            //     controller: 7,
            //     value: msg.velocity,
            // });

            if (msg.velocity) {
                console.log('mute!');

                outputRDJ.send('cc', {
                    channel: 0,
                    controller: 11,
                    value: 0,
                });
            } else {
                console.log('unmute');

                console.log('got back to:', decks.a.eq.mid);

                outputRDJ.send('cc', {
                    channel: 0,
                    controller: 11,
                    value: decks.a.eq.mid
                });
            }
        }
    }

    // deck B
    if (msg.channel == 8) {
        if (msg.note == 22) {
            console.log('B cue noteon velocity', msg.velocity);

            // SHIFT button test
            // outputRDJ.send('cc', {
            //     channel: 9,
            //     controller: 63,
            //     value: msg.velocity
            // });

            // sx2 cue button mapping
            outputRDJ.send('noteon', {
                channel: 0,
                note: 12,
                velocity: msg.velocity
            });
        }

        if (msg.note == 23) {
            console.log('B play noteon velocity', msg.velocity);

            // SHIFT button test
            // outputRDJ.send('cc', {
            //     channel: 9,
            //     controller: 63,
            //     value: msg.velocity
            // });

            // SHIFT button test
            outputRDJ.send('noteon', {
                channel: 0,
                note: 63,
                velocity: msg.velocity
            });
        }

        if (msg.note == 16) {
            console.log('B jump to beginngin noteon velocity', msg.velocity);

            outputRDJ.send('noteon', {
                channel: 0,
                note: 72,
                velocity: msg.velocity
            });
        }
    }
});


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
