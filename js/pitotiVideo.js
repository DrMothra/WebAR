/**
 * Created by DrTone on 17/05/2015.
 */


var videoPlayer = (function() {
    var player;
    var numVideos = sessionStorage.getItem('numVideos');
    var currentVideo = 0;
    var checkInterval = 500;
    var videoTitle;
    var videoSource;

    return {
        init: function() {
            for(currentVideo= 0; currentVideo<numVideos; ++currentVideo) {
                videoTitle = sessionStorage.getItem('video'+currentVideo);
                if(videoTitle) break;
            }

            if(videoTitle) {
                player = document.getElementById('videoPlayer');
                if(player) {
                    videoSource = document.createElement("source");
                    videoSource.setAttribute("src", videoTitle);
                    player.appendChild(videoSource);
                }
            }
            var videoTimer = setInterval(function() {
                //console.log("Checking");
                if(player.ended) {
                    if(++currentVideo >= numVideos) currentVideo = 0;
                    player.removeChild(videoSource);
                    //Get next video
                    videoTitle = sessionStorage.getItem('video'+currentVideo);
                    if(videoTitle) {
                        videoSource = document.createElement("source");
                        videoSource.setAttribute("src", videoTitle);
                        player.appendChild(videoSource);
                        player.load();
                        player.play();
                    }
                }
            }, checkInterval);
        },

        play: function() {
            player.play();
        }
    }
})();

$(document).ready(function() {
    //Play videos
    videoPlayer.init();



});

