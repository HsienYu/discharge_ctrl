const { getInfo } = require('ytdl-getinfo')
const youtube = require('youtube-random-video');
const { getInfo } = require('ytdl-getinfo')
const exec = require('child_process').exec;


var test = function () {
    youtube.getRandomVid("AIzaSyBNeUrC8lz0OqOoljdB1xcB-kumH0I0cE4", function (err, data) {
        //key is your youtube api key
        //data is a JSON object
        var obj = data.id;
        var vid = obj.videoId;
        var youtubeUrl = "https://www.youtube.com/watch?v=" + vid;
        console.log(youtubeUrl);
        getInfo(youtubeUrl).then(info => {
            console.log(info.items[0].url)
            var call = `omxplayer ${info.items[0].url}`;
            console.log(call);
            exec(call);
        })
        //var call = "omxplayer" + " " + "`" + `youtube-dl -g ${youtubeUrl}` + "`";
        //console.log(call);
        //exec(call);
    })
}

test();