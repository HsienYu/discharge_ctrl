const mqtt = require('mqtt');
const exec = require('child_process').exec;
const { getInfo } = require('ytdl-getinfo')
var youtube = require('youtube-random-video');
const kill = require('tree-kill');
const config = require('./config.json');

var myLog = function (lbl, vars) {
    if (verbose) console.log(lbl, vars);
}

// check for command line arguments
var args = process.argv.slice(2);
var opts = {};
for (var i = 0; i < args.length; i++) {
    if (args[i].indexOf('=') > 0) {
        var parts = args[i].split('=');
        opts[parts[0]] = parts[1];
    }
}

myLog('Command parameters: ', opts);

var verbose = (opts.verbose) ? true : config.verbose;
var url = 'tcp://';
if (opts.username && opts.password) {
    url += opts.username + ':' + opts.password + '@';
} else {
    url += config.username + ':' + config.password + '@';
}
url += (opts.host) ? opts.host : config.host;
myLog('MQTT subscriber connecting: ', url);
var client = mqtt.connect(url);
var sref = null;
var namespace = opts.namespace || config.namespace;
var playerId = opts.playerId || config.playerId;

client.on('connect', function () {
    myLog('MQTT subscriber connected: ', url);
    var topicSubscription = namespace + '/mqtt-media-player/' + playerId + '/#';
    myLog('MQTT subscribe to: ', topicSubscription);
    client.subscribe(topicSubscription);
});

var stopRunningPlayer = function () {
    if (sref && sref.pid > 0) {
        kill(sref.pid, 'SIGTERM', function () {
            myLog('Killed OMX player with PID: ', sref.pid);
            sref = null;
            client.publish(`${config.namespace}/mqtt-media-player/#`, 'stop_videos');
            client.publish('Control/Out/#', 'Finish');
        });
    }
}

var stopAllPlayer = function () {
    if (sref && sref.pid > 0) {
        kill(sref.pid, 'SIGTERM', function () {
            myLog('Killed OMX player with PID: ', sref.pid);
            sref = null;
        });
    }
}

var test = function () {
    youtube.getRandomVid("AIzaSyBNeUrC8lz0OqOoljdB1xcB-kumH0I0cE4", function (err, data) {
        //key is your youtube api key
        //data is a JSON object
        var obj = data.id;
        var vid = obj.videoId;
        var youtubeUrl = "https://www.youtube.com/watch?v=" + vid;
        console.log(youtubeUrl);
        var call = "omxplayer" + "`" + `youtube-dl -g ${youtubeUrl}` + "`";
        exec(call);
    })
}
client.on('message', function (topic, message) {
    var action = topic.toString().split('/').pop();
    myLog('MQTT subscriber action: ', action);
    var payload = message.toString();
    myLog('MQTT subscriber payload: ', payload);

    switch (action) {
        case 'play-video':
            stopAllPlayer();
            if (sref == null) {
                youtube.getRandomVid("AIzaSyBNeUrC8lz0OqOoljdB1xcB-kumH0I0cE4", function (err, data) {
                    //key is your youtube api key
                    //data is a JSON object
                    var obj = data.id;
                    var vid = obj.videoId;
                    var youtubeUrl = "https://www.youtube.com/watch?v=" + vid;
                    console.log(youtubeUrl);
                    getInfo(youtubeUrl).then(info => {
                        console.log(info.items[0].url)
                    })
                })
                var call = 'omxplayer' + `` //' --orientation 270 --aspect-mode stretch';
                sref = exec(call);
                sref.on('close', (code) => {
                    console.log('Finished');
                    stopRunningPlayer();
                });
            }
            break;
        case 'play-audio':
            stopAllPlayer();
            var call = 'omxplayer -o local ' + payload;
            sref = exec(call);
            break;
        case 'play-video-loop':
            stopAllPlayer();
            if (sref == null) {
                var call = 'omxplayer -o local ' + payload + ' --orientation 270 --aspect-mode stretch';
                sref = exec(call);
                sref.on('close', (code) => {
                    console.log('Finished');
                    stopRunningPlayer();
                });
            }
            break;
        case 'stop-video':
        case 'stop-audio':
            stopAllPlayer();
            break;
        case 'volume-up':
            if (sref) sref.stdin.write('+');
            break;
        case 'volume-down':
            if (sref) sref.stdin.write('-');
            break;
    }
});