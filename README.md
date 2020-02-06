# virtual-midi-for-rbdj
emulate virtual midi devices for communication between rekordbox dj + midi controller

--- 
### primarily for tricking rekordbox dj
any MIDI controller can do the proprietary controller niceties.
- useful for getting track volume as MIDI out CC val between 0-127 for LED VU indicators

### dependencies 
- [easymidi](https://www.npmjs.com/package/easymidi) - emulate virtual MIDI ins / outs
- [robotjs](https://www.npmjs.com/package/robotjs) - emulate QWERTY keystrokes (+ can do mouse)
