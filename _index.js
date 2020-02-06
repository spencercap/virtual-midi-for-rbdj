var easymidi = require('easymidi');

console.log('MIDI inputs:');
console.log(easymidi.getInputs());

console.log('MIDI outputs:');
console.log(easymidi.getOutputs());

var input = new easymidi.Input('QUNEO');
var output = new easymidi.Output('QUNEO');

input.on('noteon', function (msg) {
    console.log(msg);

    output.send('noteon', {
        note: msg.note,
        velocity: 127,
        channel: 0
    });

});


