var easymidi = require('easymidi');
var robot = require("robotjs");

console.log('MIDI inputs:');
console.log(easymidi.getInputs());

console.log('MIDI outputs:');
console.log(easymidi.getOutputs());

// var inputAMX = new easymidi.Input('AMX');
// var inputLocal = new easymidi.Input('Local Midi Bus');
var outputAMX = new easymidi.Output('AMX');
// var outputLocal = new easymidi.Output('Local Midi Bus');

var inputRDJ = new easymidi.Input('PIONEER DDJ-SX2');
// var outputRDJ = new easymidi.Output('PIONEER DDJ-SX2');

inputRDJ.on('cc', function (msg) {

    // channel level 1
    if (msg.channel == 0) {
        if (msg.controller == 2) {
            outputAMX.send('cc', {
                controller: 64,
                value: msg.value,
                channel: 0
            });
        }
    }

    // channel level 2
    if (msg.channel == 1) {
        if (msg.controller == 2) {
            outputAMX.send('cc', {
                controller: 65,
                value: msg.value,
                channel: 0
            });
        }
    }

});

var stdin = process.openStdin();
stdin.setRawMode(true);
stdin.setEncoding('utf8');

var counter = 0;

stdin.on('data', function (key) {
    // console.log('bang!');
    // console.log(key);
    
    // closer
    if (key === '\u0003') {
        process.exit();
    }
    
    // counter
    if (key == 'p') {
        counter++;
    } else if (key == 'l') {
        counter--;
    }
    console.log(counter);

    outputAMX.send('cc', {
        controller: 62, 
        value: counter, 
        channel: 0
    });

});



process.on('exit', code => {
    console.log('closing');
    
    // inputAMX.close();
    outputAMX.close();

    inputRDJ.close();
    // outputRDJ.close();
});

process.on('SIGINT', function () {
    process.exit();
});
