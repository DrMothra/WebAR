/**
 * Created by DrTone on 14/05/2015.
 */

var TIMELINE_SLOTS = 4;
var MAX_CLIPS = 5;
var audio_context, recorder, recording = false;
var linkNumber = 0;
var newSource = new Array(5);
var newBuffer = new Array(5);
var audioClips = [];
var RECORDING = 0, PLAYING = 1;

function __log(e, data) {
    log.innerHTML += "\n" + e + " " + (data || '');
}

var videoPlayer = (function() {
    var player;
    var numVideos = sessionStorage.getItem('numVideos');
    var vidPlayer;
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
                    vidPlayer.src = videoManager.getVideoSource(videoIndex);
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
                                vidPlayer.src = videoManager.getVideoSource(videoIndex);
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

        //DEBUG
        /*
        var link = window.document.createElement('a');
        link.href = url;
        link.download = 'output.wav';
        var click = document.createEvent("Event");
        click.initEvent("click", true, true);
        link.dispatchEvent(click);
        */


        au.controls = true;
        au.src = "sounds/creak_x.wav";
       // hf.href = url;
       // hf.download = "audioRecording"+;
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

function saveBuffer( buffers) {
    //newSource[linkNumber] = audio_context.createBufferSource();
    //DEBUG
    console.log("Creating buffer", linkNumber);
    newBuffer[linkNumber] = audio_context.createBuffer( 1, buffers[0].length, audio_context.sampleRate );
    newBuffer[linkNumber].getChannelData(0).set(buffers[0]);
    //newBuffer[linkNumber].getChannelData(1).set(buffers[1]);
    //newSource[linkNumber].buffer = newBuffer[linkNumber];
    //newSource[linkNumber].connect( audio_context.destination );

    $('#record'+linkNumber).show();

    ++linkNumber;
}

function playBuffer(bufferNumber) {
    bufferNumber = bufferNumber.charAt(bufferNumber.length-1);
    //DEBUG
    console.log("Playing buffer", bufferNumber);
    var source = audio_context.createBufferSource();
    source.buffer = newBuffer[bufferNumber];
    source.connect(audio_context.destination);
    source.start(0);
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
        //createLink();
        recorder.getBuffer(saveBuffer);
        recorder.clear();
    }
}

$(document).ready(function() {
    //Init
    skel.init();
    videoPlayer.init();
    var pageStatus = RECORDING;
    //Set up audio recording
    try {
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        //navigator.mediaDevices = navigator.mediaDevices || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        audio_context = new AudioContext;
        console.log('Audio context set up.');
        //console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
        alert('No web audio support in this browser!');
    }

    navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
        alert('No live audio input: ' + e);
    });

    //Callbacks
    $('#audioRecord').on('click', function() {
        if(linkNumber === MAX_CLIPS) {
            alert("Max recordings made");
            return;
        }
        toggleRecording();
    });

    $('#playStoryRecord').on("click", function() {
        videoPlayer.playBack();
    });

    var audioPlayer = null;
    $('#nextPageRecord').on("click", function() {
        pageStatus = PLAYING;
        var elem = sessionStorage.getItem('audioSelection');
        if(elem === "null") {
            alert("No audio selected");
            return;
        }
        $('#storyControls').hide();
        $('#nextPageRecord').hide();
        $('#finalControls').show();
        //audioPlayer = document.createElement('audio');
        //audioPlayer.src = sessionStorage.getItem('audioSelection');
    });

    $('#previousPage').on("click", function() {
        if(pageStatus === RECORDING) {
            window.location.href = "pitotiTimeline.html";
        } else {
            pageStatus = RECORDING;
            $('#storyControls').show();
            $('#nextPageRecord').show();
            $('#finalControls').hide();
        }
    });

    $('#playStoryFinal').on("click", function() {
        var index = sessionStorage.getItem('audioSelection');
        if(index != "null") {
            videoPlayer.playBack();
            playBuffer(index);
        }
    });

    var status = $('#audioRecordings img');
    $(status).on("click", function() {
        status.attr('src', 'images/redCircle.png');
        this.setAttribute('src', 'images/greenCircle.png');
        var index = this.id.charAt(this.id.length-1);
        sessionStorage.setItem('audioSelection', index);
    });

    var play = $('#audioRecordings button');
    $(play).on("click", function() {
        playBuffer(this.id);
    });



});
