var easymidi = require('easymidi');
// var robot = require("robotjs");

console.log('MIDI inputs:');
console.log(easymidi.getInputs());

console.log('MIDI outputs:');
console.log(easymidi.getOutputs());

// var inputAMX = new easymidi.Input('AMX');
var inputTwitch = new easymidi.Input('Twitch');
var outputTwitch = new easymidi.Output('Twitch');
// var outputAMX = new easymidi.Output('AMX');
// var outputLocal = new easymidi.Output('Local Midi Bus');

var inputRDJ = new easymidi.Input('PIONEER DDJ-SX');
var outputRDJ = new easymidi.Output('PIONEER DDJ-SX');

var pitchScaleFactor = 1.7;

// outputTwitch.on('cc', function(msg) {
//     console.log(msg);
// });

// inputTwitch.on('noteon', function (msg) {
//     console.log(msg);
// });

inputTwitch.on('cc', function (msg) {
    // console.log(msg);

    // deck 1
    if (msg.channel == 7) {
        // swipe / pitch bend
        if (msg.controller == 53) {
            // console.log(msg.value);

            if (msg.value < 64) {
                outputRDJ.send('cc', {
                    controller: 34,
                    value: Math.floor( (msg.value + 70) * pitchScaleFactor),
                    channel: 0
                });
            } else if (msg.value > 64) {
                outputRDJ.send('cc', {
                    controller: 34,
                    value: Math.floor( msg.value - (69 * pitchScaleFactor)),
                    channel: 0
                });
            }
        }
        // needle search / drop
        else if (msg.controller == 52) {
            // console.log(msg.value);

            outputRDJ.send('cc', {
                controller: 3,
                value: msg.value,
                channel: 0
            });
        }
    }
    // deck 2
    else if (msg.channel == 8) {
        // swipe / pitch bend
        if (msg.controller == 53) {
            // console.log(msg.value);

            if (msg.value < 64) {
                outputRDJ.send('cc', {
                    controller: 34,
                    value: Math.floor( (msg.value + 70) * pitchScaleFactor),
                    channel: 1
                });
            } else if (msg.value > 64) {
                outputRDJ.send('cc', {
                    controller: 34,
                    value: Math.floor( msg.value - (69 * pitchScaleFactor)),
                    channel: 1
                });
            }
        }
        // needle search / drop
        else if (msg.controller == 52) {
            // console.log(msg.value);

            outputRDJ.send('cc', {
                controller: 3,
                value: msg.value,
                channel: 1
            });
        }
    }

});

inputRDJ.on('cc', function(msg) {
    // console.log(msg);

    if (msg.channel == 0) {
        // deck 1 level VU meter
        if (msg.controller == 2) {
            outputTwitch.send('noteon', {
                note: 94,
                velocity: Math.floor((msg.value / 127) * 115),
                channel: 7
            });
        }
    }
    else if (msg.channel == 1) {
        // deck 2 level VU meter
        if (msg.controller == 2) {
            outputTwitch.send('noteon', {
                note: 94,
                velocity: Math.floor((msg.value / 127) * 115),
                channel: 8
            });
        }
    }

});

// var stdin = process.openStdin();
// stdin.setRawMode(true);
// stdin.setEncoding('utf8');

// var counter = 0;

// stdin.on('data', function (key) {
//     // console.log('bang!');
//     // console.log(key);

//     // closer
//     if (key === '\u0003') {
//         process.exit();
//     }

//     // counter
//     if (key == 'p') {
//         counter++;
//     } else if (key == 'l') {
//         counter--;
//     }
//     console.log(counter);

//     outputAMX.send('cc', {
//         controller: 62,
//         value: counter,
//         channel: 0
//     });
// });



process.on('exit', code => {
    console.log('closing');

    // inputAMX.close();
    inputTwitch.close();
    outputTwitch.close();
    inputRDJ.close();
    outputRDJ.close();
});

process.on('SIGINT', function () {
    process.exit();
});
