var easymidi = require('easymidi');
var robot = require("robotjs");

console.log('MIDI inputs:');
console.log(easymidi.getInputs());

console.log('MIDI outputs:');
console.log(easymidi.getOutputs());

var inputAMX = new easymidi.Input('AMX');
// var inputLocal = new easymidi.Input('Local Midi Bus');
var outputAMX = new easymidi.Output('AMX');
// var outputLocal = new easymidi.Output('Local Midi Bus');

var deckA = {};
deckA.play = false;

inputAMX.on('noteon', function (msg) {
    console.log(msg);

    // cue A
    if (msg.note == 8) {
        robot.keyToggle('a', 'down');
    }
    // cue B
    else if (msg.note == 9) {
        robot.keyToggle('h', 'down');
    }
    // headphone cue A
    else if (msg.note == 12) {
        robot.keyTap('[');
    }
    // headphone cue B
    else if (msg.note == 13) {
        robot.keyTap(']');
    }

});

inputAMX.on('noteoff', function (msg) {
    console.log(msg);

    if (msg.note == 8) {
        robot.keyToggle('a', 'up')
    }
    else if (msg.note == 9) {
        robot.keyToggle('h', 'up');
    }
    else if (msg.note == 12) {
        robot.keyTap('[');
    }
    else if (msg.note == 13) {
        robot.keyTap(']');
    }

});




process.on('exit', code => {
    console.log('closing');

    inputAMX.close();
    outputAMX.close();
});

process.on('SIGINT', function () {
    process.exit();
});