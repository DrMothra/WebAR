/**
 * Created by DrTone on 14/05/2015.
 */

var TIMELINE_SLOTS = 4;
var audio_context, recorder, recording = false;
var linkNumber = 0;
var audioClips = [];

function __log(e, data) {
    log.innerHTML += "\n" + e + " " + (data || '');
}

var videoPlayer = (function() {
    var player;
    var numVideos = sessionStorage.getItem('numVideos');
    var vidPlayer;
    var videoSources = ['videos/HuntSmall.mp4', 'videos/deersSmall.mp4', 'videos/HouseSmall.mp4'];
    var checkInterval = 500;
    var videoChecker;
    var currentSlot = 0;
    var gotClip = false;
    var playingVideo = false;

    return {
        init: function() {
            vidPlayer = document.getElementById("videoPlayer");
        },

        playBack: function() {
            if(playingVideo) return;
            playingVideo = true;
            var clip, videoIndex;
            while(!gotClip) {
                clip = sessionStorage.getItem("timeline"+currentSlot);
                if(clip) {
                    gotClip = true;
                    videoIndex = parseInt(clip.charAt(clip.length-1));
                    if(isNaN(videoIndex)) continue;
                    vidPlayer.src = videoSources[videoIndex];
                    vidPlayer.play();
                } else {
                    if(++currentSlot >= TIMELINE_SLOTS) {
                        currentSlot = 0;
                        playingVideo = false;
                        break;
                    }
                }
            }
            if(gotClip) {
                videoChecker = setInterval(function() {
                    if(vidPlayer.ended) {
                        //See if any more clips
                        if(++currentSlot >= TIMELINE_SLOTS) {
                            currentSlot = 0;
                            playingVideo = false;
                            gotClip = false;
                            clearInterval(videoChecker);
                        } else {
                            clip = sessionStorage.getItem("timeline"+currentSlot);
                            if(clip) {
                                videoIndex = parseInt(clip.charAt(clip.length-1));
                                if(isNaN(videoIndex)) return;
                                vidPlayer.src = videoSources[videoIndex];
                                vidPlayer.play();
                            }
                        }
                    }
                }, checkInterval);
            }
        }
    }
})();

$(document).ready(function() {
    //Init
    skel.init();
    videoPlayer.init();

    $('#playStory').on("click", function() {
        videoPlayer.playBack();
    });
});
