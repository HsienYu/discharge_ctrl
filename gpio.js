const PIN = require("rpi-pins");
const exec = require('child_process').exec;
const kill = require('tree-kill');

const GPIO = new PIN.GPIO();
GPIO.setPin(23, PIN.MODE.OUTPUT);
GPIO.setPin(24, PIN.MODE.INPUT);
GPIO.pullControl(24, PIN.MODE.PULL_UP);

var sref = null;

var stopRunningPlayer = function () {
    if (sref && sref.pid > 0) {
        kill(sref.pid, 'SIGTERM', function () {
            //console.Log('Killed OMX player with PID: ', sref.pid);
            sref = null;
        });
    }
}



if (GPIO.read(24)) {
    //GPIO.write(27, PIN.MODE.HIGH);
    stopRunningPlayer();
    if (sref == null) {
        var call = 'omxplayer' + '/home/pi/synctest.mp4' //' --orientation 270 --aspect-mode stretch';
        sref = exec(call);

        sref.on('close', (code) => {
            //console.log('Finished');
            stopRunningPlayer();
            GPIO.write(23, PIN.MODE.HIGH);
        });
    }
}