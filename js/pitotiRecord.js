/**
 * Created by DrTone on 14/05/2015.
 */

var TIMELINE_SLOTS = 4;
var MAX_CLIPS = 5;
var recording = false;
var linkNumber = 0;
var newSource = null;
var MAX_BUFFERS = 3;
var STOP = -1;

var recorded = false;
var audioClips = [];
var RECORDING = 0, PLAYING = 1, SUBMITTING = 2;
var UPLOADED = 0, FAILED = 1;

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
                    var number = true;
                    var value;
                    var index = clip.length - 1;
                    while(number) {
                        value = parseInt(clip.charAt(index));
                        if(isNaN(value)) {
                            number = false;
                        }
                        --index;
                    }
                    videoIndex = parseInt(clip.substring(index+2, clip.length));
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
                                var number = true;
                                var value;
                                var index = clip.length - 1;
                                while(number) {
                                    value = parseInt(clip.charAt(index));
                                    if(isNaN(value)) {
                                        number = false;
                                    }
                                    --index;
                                }
                                videoIndex = parseInt(clip.substring(index+2, clip.length));
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
            if(playingVideo) {
                vidPlayer.pause();
            }
            playingVideo = false;
            gotClip = false;
            currentSlot = 0;
        }
    }
})();

var audioSystem = (function() {
    //Set up variables
    var audioPlayersEmpty = [], audioSelected = [], newBuffer = new Array(MAX_BUFFERS);;
    var audio_context;
    var recorder;
    var bufferNumber = 0;
    var audioProgress;
    var elapsedTime = 0;
    var checkInterval = 1000;
    var started = false, stopped = false;

    return {
        init: function () {
            for(var i=0; i<MAX_BUFFERS; ++i) {
                audioPlayersEmpty.push(true);
                audioSelected.push(false);
            }
            //Set up audio recording
            try {
                // webkit shim
                window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
                navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                //navigator.mediaDevices = navigator.mediaDevices || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
                window.URL = window.URL || window.webkitURL;
                audio_context = new AudioContext;
                console.log('Audio context set up.');
            } catch (e) {
                alert('No web audio support in this browser!');
                return false;
            }

            navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
                alert('No live audio input: ' + e);
                return false;
            });

            return true;
        },

        toggleRecording: function() {
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
            var clickImage = $('#clickImage');
            recording = !recording;
            if(recording) {
                recorder.clear();
                recImage.attr('src', 'images/recordOn.png');
                clickImage.attr('src', 'images/clickRecordStop.png');
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
                clickImage.attr('src', 'images/clickRecordOn.png');
                //createLink();
                recorder.getBuffer(this.saveBuffer);
            }
        },

        saveBuffer: function(buffers) {
            newBuffer[bufferNumber] = audio_context.createBuffer( 1, buffers[0].length, audio_context.sampleRate );
            newBuffer[bufferNumber].getChannelData(0).set(buffers[0]);
        },

        playBuffer: function(buffer) {
            if(recorder.playing) return;
            window.source = audio_context.createBufferSource();
            window.source.buffer = newBuffer[buffer];
            window.source.connect(audio_context.destination);
            window.source.start(0);
            recorder.playing = true;
            window.source.onended = function() {
                recorder.playing = false;
                //DEBUG
                console.log("Audio stopped");
            }
        },

        playNextBuffer: function () {
            for(var i=0; i<MAX_BUFFERS; ++i) {
                if(audioSelected[i]) {
                    this.playBuffer(i);
                    break;
                }
            }
        },

        stopBuffer: function() {
            if(window.source) {
                window.source.stop(0);
                //DEBUG
                console.log("Audio stopped");
            }
        },

        setRecorderBuffer: function() {
            for(var i=0; i<MAX_BUFFERS; ++i) {
                if(audioSelected[i]) {
                    recorder.clear();
                    recorder.setBuffer(newBuffer[i]);
                    return true;
                }
            }
            return false;
        },

        selectEntry: function(index) {
            audioSelected[index] = true;
        },

        deleteEntry: function(index) {
            audioPlayersEmpty[index] = true;
            $('#buttons'+index).hide();
            audioSelected[index] = false;
        },

        isStopped: function() {
            return stopped;
        },

        ready: function() {
            stopped = false;
            started = false;
        },

        updateControls: function() {
            for(var i=0; i<MAX_BUFFERS; ++i) {
                if(audioPlayersEmpty[i]) {
                    $('#buttons'+i).show();
                    $('#selectButton'+i).attr("src", "images/redCircle.png");
                    audioPlayersEmpty[i] = false;
                    return;
                }
            }
        },

        audioSelected: function() {
            for(var i=0; i<MAX_BUFFERS; ++i) {
                if(audioSelected[i]) {
                    return true;
                }
            }
            return false;
        },

        uploadAudio: function() {
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
                        var number = true;
                        var value;
                        index = video.length - 1;
                        while(number) {
                            value = parseInt(video.charAt(index));
                            if(isNaN(value)) {
                                number = false;
                            }
                            --index;
                        }
                        index = parseInt(video.substring(index+2, video.length));
                        //DEBUG
                        console.log("Video =", videoManager.getVideoSource(index));

                        formData.append("video"+slot, videoManager.getVideoSource(index));
                    }
                }
                //Send data
                var status = $('#uploadStatus');
                var xhr = new XMLHttpRequest();
                xhr.open("POST", "uploadHandler.php", true);
                xhr.onreadystatechange = function() {
                    if(xhr.readyState === 4) {
                        if(xhr.status === 200) {
                            status.html("Story uploaded!");
                            console.log("Uploaded");
                            console.log("Response =", xhr.responseText);
                            return true;
                        } else {
                            console.log("Error uploading");
                            status.html("Upload failed - try again");
                            return false;
                        }
                    }
                };

                //xhr.setRequestHeader('Content-Type', 'multipart/form-data');
                xhr.send(formData);
            });
        }
    };

    function startUserMedia(stream) {
        window.input = audio_context.createMediaStreamSource(stream);
        console.log('Media stream created.');
        // Uncomment if you want the audio to feedback directly
        //input.connect(audio_context.destination);
        //__log('Input connected to audio context destination.');

        recorder = new Recorder(window.input);
        console.log('Recorder initialised.');
        recorder.playing = false;
    }
})();

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

function getUserDetails() {
    $('#videoPlayer').hide();
    $('#finalControls').hide();
    $('#audioProgress').hide();
    $('#nextPageRecord').hide();
    $('#configureEntry').show();
}

function showUploadStatus() {
    $('#videoPlayer').show();
    $('#finalControls').show();
    $('#audioProgress').show();
    $('#configureEntry').hide();
}

function uploadStory() {
    var status = $('#uploadStatus');
    status.html("Uploading...");
    status.show();

    var bufferOK = audioSystem.setRecorderBuffer();
    if(!bufferOK) {
        alert("No audio selected!");
        return;
    }

    audioSystem.uploadAudio();
}

$(document).ready(function() {
    //Init
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userMail");

    //Video
    videoPlayer.init();

    //Audio
    var audioOK = audioSystem.init();
    if(!audioOK) {
        alert("Couldn't initialise audio system");
        return;
    }

    var pageStatus = RECORDING;

    //Callbacks
    $('#audioRecord').on('click', function() {
        audioSystem.toggleRecording();
        if(audioSystem.isStopped()) {
            audioSystem.ready();
            audioSystem.updateControls();
        } else {
            videoPlayer.rewind();
            videoPlayer.playBack();
        }
    });

    $('#playStoryRecord').on("click", function() {
        videoPlayer.playBack();
    });

    $('#nextPageRecord').on("click", function() {
        switch(pageStatus) {
            case RECORDING:
                if(!audioSystem.audioSelected()) {
                    alert("No audio selected");
                    return;
                }
                pageStatus = PLAYING;
                //Stop any audio playing
                audioSystem.stopBuffer();
                //Video back to start
                videoPlayer.rewind();
                $('#storyControls').hide();
                $('#finalControls').show();
                $('#azirRecord').hide();

                break;

            case PLAYING:
                if(sessionStorage.getItem("userName") === null) {
                    var discard = confirm("This will discard your story!");
                    if(discard) {
                        window.location.href = "pitotiThanks.html";
                    }
                }
                break;

            case SUBMITTING:
                if(sessionStorage.getItem("userName") === null || !uploadStatus) {
                    var discard = confirm("This will discard your story!");
                    if(discard) {
                        window.location.href = "pitotiThanks.html";
                    }
                }
                break;

            default:
                break;
        }
    });

    $('.previousPageColumn').on("click", function() {
        if(pageStatus === RECORDING) {
            window.location.href = "pitotiTimeline.html";
        } else {
            videoPlayer.rewind();
            pageStatus = RECORDING;
            audioSystem.stopBuffer();
            $('#storyControls').show();
            $('#nextPageRecord').show();
            $('#finalControls').hide();
        }
    });

    $('#playStoryFinal').on("click", function() {
        videoPlayer.rewind();
        videoPlayer.playBack();
        audioSystem.playNextBuffer();
    });

    var index;
    var uploadStatus = true;

    $('[id^=audioButton]').on("click", function() {
        videoPlayer.rewind();
        videoPlayer.playBack();
        index = parseInt(this.id.charAt(this.id.length-1));
        audioSystem.playBuffer(index);
    });

    $('[id^=deleteButton]').on("click", function() {
        index = parseInt(this.id.charAt(this.id.length-1));
        audioSystem.deleteEntry(index);
    });

    $('[id^=selectButton]').on("click", function() {
        index = parseInt(this.id.charAt(this.id.length-1));
        $('[id^=selectButton]').attr("src", "images/redCircle.png");
        $('#selectButton'+index).attr("src", "images/greenCircle.png");
        audioSystem.selectEntry(index);
    });

    $('#uploadStory').on("click", function() {
        pageStatus = SUBMITTING;
        if(!uploadStatus) {
            uploadStory();
        } else {
            getUserDetails();
        }
    });

    $('#cancelDetails').on("click", function() {
        showUploadStatus();
        $('#nextPageRecord').show();
        pageStatus = PLAYING;
    });

    //Store user details
    var userForm = document.getElementById("enterDetails");
    userForm.onsubmit = function(event) {
        event.preventDefault();

        var name = $('#name').val();
        var mail = $('#mail').val();
        if(name === "") {
            alert("Please enter valid name");
            return;
        }
        if(mail === "") {
            alert("Please enter valid e-mail");
            return;
        }

        sessionStorage.setItem("userName", name);
        sessionStorage.setItem("userMail", mail);

        showUploadStatus();
        $('#nextPageRecord').show();

        uploadStatus = uploadStory();
    };

});
