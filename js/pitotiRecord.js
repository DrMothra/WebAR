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
            sessionStorage.setItem("audioSelection",null);
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

function startUserMedia(stream) {
    var input = audio_context.createMediaStreamSource(stream);
    console.log('Media stream created.');
    // Uncomment if you want the audio to feedback directly
    //input.connect(audio_context.destination);
    //__log('Input connected to audio context destination.');

    recorder = new Recorder(input);
    console.log('Recorder initialised.');
}

function createLink() {
    //Create list of audio links
    recorder.exportWAV(function(blob) {
        var url = window.URL.createObjectURL(blob);
        var li = document.createElement('li');
        var au = document.createElement('audio');
        au.setAttribute("type", "audio/wav");
        //var hf = document.createElement('a');
        var status = document.createElement('img');

        au.controls = true;
        au.src = url;
        //hf.href = url;
        //hf.download = new Date().toISOString() + '.wav';
        //hf.innerHTML = hf.download;
        audioClips.push(url);
        status.src = "images/redCircle.png";
        status.id = "audioSelect" + linkNumber;
        status.style.width = "5%";
        status.onclick = function() {
            $('#audioRecordings img').attr('src', 'images/redCircle.png');
            this.setAttribute('src', 'images/greenCircle.png');
            var index = this.id.substr(this.id.length - 1);
            sessionStorage.setItem('audioSelection', audioClips[index]);
        };
        li.appendChild(status);
        li.appendChild(au);
        //li.appendChild(hf);
        audioRecordings.appendChild(li);
        ++linkNumber;
    });
}

function toggleRecording() {
    //Start/stop recording
    if(!recorder) return;

    var recImage = $('#audioRecord');
    recording = !recording;
    if(recording) {
        recImage.attr('src', 'images/recordOn.png');
        recorder.record();
    } else {
        recorder.stop();
        recImage.attr('src', 'images/recordOff.png');
        createLink();
        recorder.clear();
    }
}

$(document).ready(function() {
    //Init
    skel.init();
    videoPlayer.init();
    //Set up audio recording
    try {
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        //navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        navigator.mediaDevices = navigator.mediaDevices || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        audio_context = new AudioContext;
        console.log('Audio context set up.');
        //console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
        alert('No web audio support in this browser!');
    }

    var p = navigator.mediaDevices.getUserMedia({audio: true}, startUserMedia, function(e) {
        alert('No live audio input: ' + e);
    });

    //Callbacks
    $('#audioRecord').on('click', function() {
        toggleRecording();
    });

    $('#playStoryRecord').on("click", function() {
        videoPlayer.playBack();
    });

    var audioPlayer = null;
    $('#nextPageRecord').on("click", function() {
        var elem = sessionStorage.getItem('audioSelection');
        if(elem === "null" || audioClips.length === 0) {
            alert("No audio selected");
            return;
        }
        $('#storyControls').hide();
        $('#nextPageRecord').hide();
        $('#finalControls').show();
        audioPlayer = document.createElement('audio');
        audioPlayer.src = sessionStorage.getItem('audioSelection');
    });

    $('#playStoryFinal').on("click", function() {
        if(audioPlayer != null) {
            videoPlayer.playBack();
            audioPlayer.play();
        }
    })
});
