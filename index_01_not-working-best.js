var easymidi = require('easymidi');

console.log('MIDI inputs:');
console.log(easymidi.getInputs());

console.log('MIDI outputs:');
console.log(easymidi.getOutputs());

var input = new easymidi.Input('AMX');
var input2 = new easymidi.Input('Test Bus 1');
var output = new easymidi.Output('AMX');
var output2 = new easymidi.Output('Test Bus 1');

var deckA = {};
deckA.play = false;

input.on('noteon', function (msg) {
    console.log(msg);

    if (msg.note == 10) {
        deckA.play = true;

        output2.send('noteon', {
            note: 10,
            velocity: 127,
            channel: 0
        });
    }

    if (msg.note == 8) {
        console.log('got it 1');

        output2.send('noteon', {
            note: 8,
            velocity: 127,
            channel: 0
        });
    }

    

});

// input2.on('noteon', function (msg) {
//     console.log('2:');
//     console.log(msg);
// });

input.on('noteoff', function (msg) {
    console.log(msg);

    if (msg.note == 10) {
        deckA.play = false;
        
        output2.send('noteoff', {
            note: 10,
            velocity: 0,
            channel: 0
        });
    }

    if (msg.note == 8 && !deckA.play) {
        console.log('got it 2');

        output2.send('noteon', {
            note: 8,
            velocity: 127,
            channel: 0
        });
    }

});


