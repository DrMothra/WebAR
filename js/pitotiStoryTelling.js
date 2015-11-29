/**
 * Created by atg on 20/11/2015.
 */


var storyPlayer = (function() {
    //Init any vars
    var videoPlayer;
    var videoChecker;
    var checkInterval = 500;
    var currentStory = 0;
    var MAX_STORIES = 4;

    return {
        init: function() {
            videoPlayer = document.getElementById("videoPlayer");
            if(!videoPlayer) {
                console.log("No video player!!");
            }
            var vidIndex = sessionStorage.getItem("videoStory0");
            if(!vidIndex) {
                alert("No videos downloaded!");
                return;
            }
            videoPlayer.src = videoManager.getVideoSource(vidIndex, HIGH);

            //DEBUG
            console.log("Src = ", videoPlayer.src);

            this.startVideoTimer();
        },

        rewind: function() {
            videoPlayer.pause();
            videoPlayer.src = videoManager.getVideoSource(sessionStorage.getItem("videoStory"+0));
        },

        playBack: function() {
            videoPlayer.play();
        },

        startVideoTimer: function() {
            videoChecker = setInterval(function() {
                if(videoPlayer.ended) {
                    //Get next video
                    if(videoPlayer.currentTime === 0) return;
                    //DEBUG
                    console.log("Video ended");
                    var vidIndex;
                    ++currentStory;
                    var playing = false;
                    for(var i=currentStory; i<MAX_STORIES; ++i) {
                        vidIndex = sessionStorage.getItem("videoStory"+i);
                        if(vidIndex) {
                            //DEBUG
                            console.log("Playing next video");
                            videoPlayer.src = videoManager.getVideoSource(vidIndex);
                            videoPlayer.play();
                            playing = true;
                            break;
                        }
                    }
                    if(!playing) {
                        //Finished
                        //DEBUG
                        console.log("Finished");
                        currentStory = 0;
                        videoPlayer.currentTime = 0;
                        videoPlayer.src = videoManager.getVideoSource(sessionStorage.getItem("videoStory"+0));
                    }
                }
            }, checkInterval)
        }
    }
})();


$(document).ready(function() {

    storyPlayer.init();

    $('#playStoryFinal').on("click", function() {
        storyPlayer.rewind();
        storyPlayer.playBack();
    });
});