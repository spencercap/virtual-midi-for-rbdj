// imports
var easymidi = require('easymidi'); // helpful package

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

/* ------------------------------------- */
/* ------------------------------------- */
/* ------------------------------------- */

// listen for messages from rekordbox:
inputRDJ.on('cc', function (msg) {
    // console.log('[T-LOG]: msg', msg);

    // channel volume level 1
    if (msg.channel == 0) {
        if (msg.controller == 2) {
            // console.log(msg.value);

            // outputMidi.send('cc', {
            //     controller: 64,
            //     value: msg.value,
            //     channel: 0
            // });
        }
    }

    // channel volume level 2
    if (msg.channel == 1) {
        if (msg.controller == 2) {

            // outputMidi.send('cc', {
            //     controller: 65,
            //     value: msg.value,
            //     channel: 0
            // });
        }
    }

    if (msg.channel == 11) {
        console.log('[T-LOG]: msg', msg);
    }

});


inputMidi.on('cc', function (msg) {
    // console.log('msg', msg);

    if (msg.channel == 7) {
        if (msg.controller == 3) {
            // console.log('val', msg.value);

            outputRDJ.send('cc', {
                channel: 6,
                controller: 64,
                value: msg.value,
            });
            // 64
        }
    }

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
inputMidi.on('noteon', function (msg) {
    // console.log('msg', msg);

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
