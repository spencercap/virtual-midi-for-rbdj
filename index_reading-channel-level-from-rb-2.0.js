var easymidi = require('easymidi');

console.log('MIDI inputs:');
console.log(easymidi.getInputs());
console.log('MIDI outputs:');
console.log(easymidi.getOutputs());

var inputRDJ = new easymidi.Input('PIONEER DDJ-SX2');
var outputAMX = new easymidi.Output('AMX');

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

process.on('exit', code => {
    console.log('closing process');
    inputRDJ.close();
    outputAMX.close();
});

process.on('SIGINT', function () {
    process.exit();
});
