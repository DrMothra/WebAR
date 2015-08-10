/**
 * Created by DrTone on 14/05/2015.
 */

var TIMELINE_SLOTS = 4;
var MAX_CLIPS = 5;
var audio_context, recorder, recording = false;
var linkNumber = 0;
var bufferNumber = 0;
var newSource = null;
var MAX_BUFFERS = 3;
var newBuffer = new Array(MAX_BUFFERS);
var recorded = false;
var audioClips = [];
var RECORDING = 0, PLAYING = 1;
var started = false, stopped = false;
var audioPlayersEmpty = new Array(3);
var audioSelected = new Array(3);
var audioProgress;
var elapsedTime = 0;
var checkInterval = 1000;

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
                        clearInterval(videoChecker);
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
        },

        rewind: function() {
            vidPlayer.pause();
            playingVideo = false;
            gotClip = false;
        }
    }
})();

function startUserMedia(stream) {
    window.input = audio_context.createMediaStreamSource(stream);
    console.log('Media stream created.');
    // Uncomment if you want the audio to feedback directly
    //input.connect(audio_context.destination);
    //__log('Input connected to audio context destination.');

    recorder = new Recorder(window.input);
    console.log('Recorder initialised.');
}

function sendFilesToServer() {
    //DEBUG
    console.log("Sending files to server");

    recorder.exportWAV(function(blob) {
        var formData = new FormData();
        formData.append("audioFile", blob, "story.wav");

        //Send data
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "uploadHandler.php", true);
        xhr.onload = function() {
            if(xhr.status === 200) {
                console.log("Uploaded");
            } else {
                alert("Upload error");
            }
        };

        xhr.send(formData);
    })
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
    //DEBUG
    console.log("Creating buffer", buffers);
    newBuffer[bufferNumber] = audio_context.createBuffer( 1, buffers[0].length, audio_context.sampleRate );
    newBuffer[bufferNumber].getChannelData(0).set(buffers[0]);
    //newBuffer.getChannelData(1).set(buffers[1]);
}

function playBuffer(buffer) {
    window.source = audio_context.createBufferSource();
    window.source.buffer = newBuffer[buffer];
    window.source.connect(audio_context.destination);
    window.source.start(0);
}

function toggleRecording() {
    //Start/stop recording
    if(!recorder) return;

    var empty = false;
    for(var i=0; i<MAX_BUFFERS; ++i) {
        if(audioPlayersEmpty[i]) {
            empty = true;
            bufferNumber = i;
            break;
        }
    }
    if(!empty) {
        alert("Max recordings reached");
        return;
    }

    var recImage = $('#audioRecord');
    recording = !recording;
    if(recording) {
        recorder.clear();
        recImage.attr('src', 'images/recordOn.png');
        recorder.record();
        audioProgress = setInterval(function() {
            $('#audioProgress').attr("value", ++elapsedTime);
            if(elapsedTime >= 60) {
                elapsedTime = 0;
                $('#audioProgress').attr("value", 0);
                recorder.stop();
                clearInterval(audioProgress);
                recorded = true;
                stopped = false;
                recImage.attr('src', 'images/recordOff.png');
                recorder.getBuffer(saveBuffer);
                for(var i=0; i<MAX_BUFFERS; ++i) {
                    if(audioPlayersEmpty[i]) {
                        $('#buttons'+i).show();
                        $('#selectButton'+i).attr("src", "images/redCircle.png");
                        audioPlayersEmpty[i] = false;
                        break;
                    }
                }
            }
        }, checkInterval);
        started = true;

    } else {
        recorder.stop();
        elapsedTime = 0;
        clearInterval(audioProgress);
        $('#audioProgress').attr("value", 0);
        recorded = true;
        stopped = true;
        recImage.attr('src', 'images/recordOff.png');
        //createLink();
        recorder.getBuffer(saveBuffer);
    }
}

$(document).ready(function() {
    //Init
    skel.init();
    videoPlayer.init();
    for(var i=0; i<MAX_BUFFERS; ++i) {
        audioPlayersEmpty[i] = true;
    }

    //DEBUG
    console.log("Name =", sessionStorage.getItem("userName"));

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
        toggleRecording();
        if(stopped) {
            stopped = false;
            started = false;
            for(var i=0; i<MAX_BUFFERS; ++i) {
                if(audioPlayersEmpty[i]) {
                    $('#buttons'+i).show();
                    $('#selectButton'+i).attr("src", "images/redCircle.png");
                    audioPlayersEmpty[i] = false;
                    break;
                }
            }

        }
    });

    $('#playStoryRecord').on("click", function() {
        videoPlayer.playBack();
    });

    var audioPlayer = null;
    $('#nextPageRecord').on("click", function() {
        var audio = false;
        for(var i=0; i<MAX_BUFFERS; ++i) {
            if(audioSelected[i]) {
                audio = true;
                break;
            }
        }
        if(!audio) {
            alert("No audio selected");
            return;
        }
        pageStatus = PLAYING;
        //Video back to start
        videoPlayer.rewind();
        $('#storyControls').hide();
        $('#nextPageRecord').hide();
        $('#finalControls').show();
        //audioPlayer = document.createElement('audio');
        //audioPlayer.src = sessionStorage.getItem('audioSelection');
    });

    $('.previousPageColumn').on("click", function() {
        if(pageStatus === RECORDING) {
            window.location.href = "pitotiTimeline.html";
        } else {
            videoPlayer.rewind();
            pageStatus = RECORDING;
            $('#storyControls').show();
            $('#nextPageRecord').show();
            $('#finalControls').hide();
        }
    });

    $('#playStoryFinal').on("click", function() {
        videoPlayer.playBack();
        for(var i=0; i<MAX_BUFFERS; ++i) {
            if(audioSelected[index]) {
                playBuffer(index);
                break;
            }
        }

    });

    var index;
    $('[id^=audioButton]').on("click", function() {
        index = parseInt(this.id.charAt(this.id.length-1));
        playBuffer(index);
    });

    $('[id^=deleteButton]').on("click", function() {
        index = parseInt(this.id.charAt(this.id.length-1));
        audioPlayersEmpty[index] = true;
        $('#buttons'+index).hide();
        audioSelected[index] = false;
    });

    $('[id^=selectButton]').on("click", function() {
        index = parseInt(this.id.charAt(this.id.length-1));
        $('[id^=selectButton]').attr("src", "images/redCircle.png");
        $('#selectButton'+index).attr("src", "images/greenCircle.png");
        audioSelected[index] = true;
    });

    var form = document.getElementById("uploadForm");
    form.onsubmit = function(event) {
        var status = $('#uploadStatus');
        status.show();

        event.preventDefault();


        var bufferIndex;
        for(var i=0; i<MAX_BUFFERS; ++i) {
            if(audioSelected[i]) {
                recorder.setBuffer(newBuffer[i]);
                bufferIndex = i;
                break;
            }
        }

        //recorder.setBuffer(audioBuffer);
        recorder.exportWAV(function(blob) {
            var formData = new FormData();

            var userName = sessionStorage.getItem("userName");
            if(userName) {
                formData.append("userName", userName);
            } else {
                alert("No user name");
            }
            var email = sessionStorage.getItem("userMail");
            if(email) {
                formData.append("email", email);
            } else {
                alert("No e-mail");
            }

            var audioFilename = "story_" + userName + "_" + new Date().toUTCString() + ".mp3";


            formData.append("audioFile", blob, audioFilename);

            //Get videos
            var video, index;
            for(var slot=0; slot<TIMELINE_SLOTS; ++slot) {
                video = sessionStorage.getItem("timeline"+slot);
                if(video) {
                    index = parseInt(video.charAt(video.length-1));
                    //DEBUG
                    console.log("Video =", videoManager.getVideoSource(index));

                    formData.append("video"+slot, videoManager.getVideoSource(index));
                }
            }
            //Send data
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "uploadHandler.php", true);
            xhr.onreadystatechange = function() {
                if(xhr.readyState === 4) {
                    if(xhr.status === 200) {
                        status.html("Story uploaded!");
                        console.log("Uploaded");
                        console.log("Response =", xhr.responseText);
                    } else {
                        console.log("Error uploading");
                        status.html("Upload failed - try again");
                    }
                }
            };

            //xhr.setRequestHeader('Content-Type', 'multipart/form-data');
            xhr.send(formData);
        })
    }
});
