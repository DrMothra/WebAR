/**
 * Created by DrTone on 07/07/2015.
 */
var NUM_CONTAINERS = 8;
var TIMELINE_SLOTS = 4;
var MAX_VIDEO_TIME = 60;
var STOPPED=0, PLAYING=1, PAUSED=2;
var MAX_BUFFERS = 2;
var RECORDING = 0, UPLOADING = 1;

var audioSystem = (function() {
    //Set up variables
    var audioPlayersEmpty = [], audioSelected = [], newBuffer = new Array(MAX_BUFFERS);
    var audio_context;
    var audioRecorded = false;
    var currentAudioBuffer = 0;
    var startTime = 0;
    var recorder;
    var recording = false;
    var bufferNumber = 0;
    var audioProgress;
    var elapsedTime = 0;
    var elapsedPlayTime = 0;
    var checkInterval = 1000;
    var started = false, stopped = false;
    var uploaded = false;

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

            var recImage = $('#audioRecord');
            recording = !recording;
            if(recording) {
                recorder.clear();
                elapsedTime = 0;
                recImage.attr('src', 'images/micOn.png');
                var progress = $('#audioProgress');
                recorder.record();
                var _this = this;
                audioProgress = setInterval(function() {
                    progress.attr("value", ++elapsedTime);
                    if(elapsedTime >= 60) {
                        elapsedTime = 0;
                        progress.attr("value", 0);
                        recorder.stop();
                        clearInterval(audioProgress);
                        recorded = true;
                        stopped = false;
                        recImage.attr('src', 'images/micOff.png');
                        audioRecorded = true;
                        recorder.getBuffer(_this.saveBuffer);
                    }
                }, checkInterval);
                started = true;

            } else {
                recorder.stop();
                //DEBUG
                console.log("Recording time = ", elapsedTime);
                audioRecorded = true;
                clearInterval(audioProgress);
                $('#audioProgress').attr("value", 0);
                recorded = true;
                stopped = true;
                recImage.attr('src', 'images/micOff.png');
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
            if(elapsedPlayTime === 0) {
                startTime = new Date().getTime();
                //DEBUG
                console.log("Start =", startTime);
            }
            window.source.start(0, elapsedPlayTime / 1000);
            recorder.playing = true;
            window.source.onended = function() {
                recorder.playing = false;
            }
        },

        playNextBuffer: function () {
            if(audioRecorded) {
                this.playBuffer(currentAudioBuffer);
            }
        },

        rewind: function() {
            elapsedPlayTime = 0;
        },

        pausePlayback: function() {
            if(audioRecorded) {
                elapsedPlayTime = new Date().getTime() - startTime;
                //DEBUG
                console.log("Audio paused time = ", elapsedPlayTime);
                window.source.stop(0);
                recorder.playing = false;
            }
        },

        setMaxTime: function(time) {
            maxElapsedTime = time;
        },

        stopBuffer: function() {
            if(window.source) {
                window.source.stop(0);
                //DEBUG
                console.log("Audio stopped");
            }
        },

        setRecorderBuffer: function() {
            recorder.clear();
            recorder.setBuffer(newBuffer[0]);
            return true;
        },

        selectEntry: function(index) {
            for(var i= 0, len=audioSelected.length; i<len; ++i) {
                audioSelected[i] = false;
            }
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

        reset: function() {
            elapsedPlayTime = 0;
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

        audioRecorded: function() {
            return audioRecorded;
        },

        uploadAudio: function() {
            recorder.exportWAV(function(blob) {
                var formData = new FormData();

                var userName = sessionStorage.getItem("userName");
                if(userName) {
                    formData.append("userName", userName);
                } else {
                    alert("No user name");
                    uploaded = false;
                    return;
                }
                var email = sessionStorage.getItem("userMail");
                if(email) {
                    formData.append("email", email);
                } else {
                    alert("No e-mail");
                    uploaded = false;
                    return;
                }

                var audioFilename = userName + "_";


                //formData.append("audioFile", blob, audioFilename);

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

                        audioFilename += index.toString() + "_";
                    }
                }
                audioFilename += new Date().toUTCString() + ".mp3";
                //DEBUG
                console.log("audioFilename =", audioFilename);

                formData.append("audioFile", blob, audioFilename);

                //Send data
                var status = $('#uploadStory');
                var xhr = new XMLHttpRequest();
                xhr.open("POST", "uploadHandler.php", true);
                xhr.onreadystatechange = function() {
                    if(xhr.readyState === 4) {
                        if(xhr.status === 200) {
                            status.attr("src", "images/uploadStoryUploaded.png");
                            uploaded = true;
                        } else {
                            console.log("Error uploading");
                            status.attr("src", "images/uploadStoryFailed.png");
                            uploaded = false;
                        }
                    }
                };

                //xhr.setRequestHeader('Content-Type', 'multipart/form-data');
                xhr.send(formData);
            });
        },

        getUploadStatus: function() {
            return uploaded;
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

var videoPlayer = (function() {
    //Timeline
    var timelineSlots = [];
    var videoSources = [];
    for(var i=0; i<TIMELINE_SLOTS; ++i) {
        timelineSlots.push(false);
        videoSources.push(null);
    }
    var numVideos = 0;
    var checkInterval = 1000;
    var videoChecker;
    var dragImage, dragTrashImage;
    var progressBar;
    var currentElapsed = 0;
    var timelineOccupied = false;
    var currentTimeslot = 0;
    var timerRunning = false;
    var videoWidth, videoHeight;
    var videoPlayer;
    var TIME_PER_VDEO = 15;
    var videoTimeLength = 0;
    var started = false;
    var videoPlaying = false;
    var videoEnded = false;
    var _this = this;

    return {
        init: function() {
            //Fill video slots
            var i, src, elem;
            for(i=0; i<NUM_CONTAINERS; ++i) {
                src = sessionStorage.getItem("slot" + i);
                if(src != "null" && src != null) {
                    elem = document.getElementById("slot" + i);
                    elem.src = "images/" + src;
                }
            }
            videoPlayer = document.getElementById("videoPlayer");
            if(!videoPlayer) {
                console.log("No video player!!");
            }
            //Clear timeline
            for(var i=0; i<NUM_CONTAINERS; ++i) {
                sessionStorage.removeItem("timeline"+i);
            }

            //Dragged elements
            var elem = document.getElementById("slot0");
            var imageWidth = elem ? elem.clientWidth : window.innerWidth * 0.09;
            if(imageWidth >= 160 || imageWidth < 10) {
                imageWidth = window.innerWidth * 0.09;
            }
            dragImage = document.createElement("img");
            dragImage.src = "images/dragTimeline.png";
            dragImage.style.width = imageWidth +"px";
            //DEBUG
            //console.log("Width =", imageWidth);
            dragImage.style.zIndex = "100";

            dragTrashImage = document.createElement("img");
            dragTrashImage.src = "images/dragTrash.png";
            dragTrashImage.style.width = imageWidth+"px";
            dragImage.style.zIndex = "100";

            //Video containers
            var vidElem = document.getElementById("timeline0");
            videoWidth = vidElem ? vidElem.clientWidth : window.innerWidth * 0.09;
            videoHeight = vidElem ? vidElem.clientHeight : window.innerHeight * 0.09;

            //DEBUG
            //console.log("Width =", videoWidth, "Height =", videoHeight);

            progressBar = document.getElementById("elapsed");
            this.startVideoTimer();
        },

        getDragImage: function() {
            return dragImage;
        },

        getDragTrashImage: function() {
            return dragTrashImage;
        },

        drop: function(event, ui) {
            var id = event.target.id;
            var slot = parseInt(id.charAt(id.length-1));
            if(isNaN(slot)) return;

            if(timelineSlots[slot]) return;

            //DEBUG
            //console.log("Slot =", slot);

            var dragged = $(ui.draggable);
            var image = document.getElementById(id);
            image.src = dragged.attr('src');
            image.style.width = videoWidth + "px";
            image.style.height = videoHeight + "px";
            //Get video index
            var number = true;
            var value;
            var index = image.src.length - 5;
            while(number) {
                value = parseInt(image.src.charAt(index));
                if(isNaN(value)) {
                    number = false;
                }
                --index;
            }
            var videoIndex = parseInt(image.src.substring(index+2, image.src.length));
            timelineSlots[slot] = true;
            videoSources[slot] = videoIndex;

            //DEBUG
            //console.log("Video =", videoIndex);

            ++numVideos;

            videoTimeLength = numVideos * TIME_PER_VDEO;

            sessionStorage.setItem("numVideos", numVideos);
            sessionStorage.setItem("timeline"+slot, "video"+videoIndex);
            //Enable next again
            this.setTimelineOccupied(true);
            this.setPlayerSource();
            $('#playControl').show();
        },

        setPlayerSource: function() {
            for(var i=0; i<TIMELINE_SLOTS; ++i) {
                if(timelineSlots[i]) {
                    videoPlayer.src = videoManager.getVideoSource(videoSources[i]);
                    currentTimeslot = i;
                    return;
                }
            }
        },

        getFirstTimeslot: function() {
            for(var i=0; i<TIMELINE_SLOTS; ++i) {
                if(timelineSlots[i]) {
                    return videoSources[i];
                }
            }
            console.log("Slots empty");
            return -1;
        },

        playBack: function() {
            if(numVideos === 0) {
                alert("No videos in timeline!");
                return;
            }
            videoPlayer.play();
            videoPlaying = true;
            videoEnded = false;
        },

        isPlaying: function() {
            return videoPlaying;
        },

        startVideoTimer: function() {
            videoChecker = setInterval(function() {
                if(videoPlayer.ended) {
                    //Get next video
                    if(videoPlayer.currentTime === 0) return;
                    //DEBUG
                    //console.log("Video ended");
                    ++currentTimeslot;
                    console.log("Timeslot now ", currentTimeslot);
                    var playing = false;
                    for(var i=currentTimeslot; i<TIMELINE_SLOTS; ++i) {
                        if(timelineSlots[i]) {
                            //DEBUG
                            console.log("Playing next video");
                            videoPlayer.src = videoManager.getVideoSource(videoSources[i]);
                            videoPlayer.play();
                            playing = true;
                            videoEnded = false;
                            currentTimeslot = i;
                            //DEBUG
                            console.log("current timeslot =", currentTimeslot);
                            break;
                        }
                    }
                    if(!playing) {
                        //Finished
                        //DEBUG
                        console.log("Finished");
                        videoPlaying = false;
                        videoEnded = true;
                        currentTimeslot = 0;
                        videoPlayer.currentTime = 0;
                        videoPlayer.src = videoManager.getVideoSource(videoSources[0]);
                        $('#playControl').show();
                    }
                }
            }, checkInterval)
        },

        rewind: function() {
            if(numVideos === 0) {
                console.log("No videos in timeline");
                return;
            }
            videoPlayer.pause();
            videoPlayer.src = videoManager.getVideoSource(this.getFirstTimeslot());
            videoPlaying = false;
            currentTimeslot = 0;
        },

        pausePlayback: function() {
            videoPlayer.pause();
            videoPlaying = false;
        },

        trash: function(event, ui) {
            var dragged = $(ui.draggable);
            var id = dragged.attr('id');
            var slot = parseInt(id.charAt(id.length-1));
            if(isNaN(slot)) return;

            timelineSlots[slot] = false;
            --numVideos;
            videoTimeLength = numVideos * TIME_PER_VDEO;
            sessionStorage.setItem("numVideos", numVideos);
            sessionStorage.removeItem("timeline"+slot);
            //Restore original image
            var timelineSlot = document.getElementById("timeline"+slot);
            timelineSlot.src = "images/emptyTimeline.png";
            if(numVideos === 0) {
                this.setTimelineOccupied(false);
                videoPlayer.src = "";
            }
        },

        setTimelineOccupied: function(occupied) {
            timelineOccupied = occupied;
        },

        timelineOccupied: function() {
            return timelineOccupied;
        },

        videoEnded: function() {
            return videoEnded;
        },

        getVideoLength: function() {
            return videoTimeLength;
        },

        getStatus: function() {
            return timerRunning;
        }
    }
})();

function showUploadPage() {
    //Hide previous elements - show upload
    $('#timeLineControls').hide();
    $('#clipTray').hide();
    $('#azirTimeline').hide();

    //Upload
    $('#vidFrame').show();
    $('#finalControls').show();
    $('#previousTimelinePage').show();
    $('#nextARPage').show();
    $('#uploadStory').attr("src", "images/uploadStory.png");
    $('#configureEntry').hide();
}

function showTimelinePage() {
    //Hide uploads - show timeline
    $('#timeLineControls').show();
    $('#clipTray').show();
    $('#azirTimeline').show();

    //Upload
    $('#finalControls').hide();
}

function getUserDetails() {
    $('#vidFrame').hide();
    $('#finalControls').hide();
    $('#nextPageRecord').hide();
    $('#previousTimelinePage').hide();
    $('#nextARPage').hide();

    $('#configureEntry').show();
}

function uploadStory() {
    var status = $('#uploadStatus');
    status.html("Uploading...");
    status.show();

    if(audioSystem.audioRecorded()) {
        var bufferOK = audioSystem.setRecorderBuffer();
        if(!bufferOK) {
            alert("No audio selected!");
            return;
        }
    }
    audioSystem.uploadAudio();
}

function playPauseVideo() {
    if(videoPlayer.isPlaying()) {
        $('#playControl').show();
        videoPlayer.pausePlayback();
        audioSystem.pausePlayback();
    } else {
        $('#playControl').hide();
        if(videoPlayer.videoEnded()) {
            //DEBUG
            console.log("Video ended, audio reset");
            audioSystem.reset();
        }
        videoPlayer.playBack();
        audioSystem.playNextBuffer();
    }
}

function clearSlots() {
    for(var i=0; i<NUM_CONTAINERS; ++i) {
        sessionStorage.removeItem("slot"+i);
    }
}

$(window).load(function() {
    //Init
    var pageStatus = RECORDING;

    videoPlayer.init();

    //Audio
    var audioOK = audioSystem.init();
    if(!audioOK) {
        alert("Couldn't initialise audio system");
        return;
    }

    var dragElem = $('.drag img');
    dragElem.draggable( {
        revert: "invalid",
        helper: function(event) {
            return videoPlayer.getDragImage();
        }
    });

    var dragTimeline = $('.timeDrop img');
    dragTimeline.draggable( {
            revert: "invalid",
        helper: function(event) {
            return videoPlayer.getDragTrashImage();
        }
    });

    var targetElem = $('img[id^=timeline]');
    targetElem.droppable( {
        accept: ".drag img",
        drop: function( event, ui) {
            videoPlayer.drop(event, ui);
        }
    });

    var trashElem = $('#timeTrash');
    trashElem.droppable( {
        accept: ".timeDrop img",
        drop: function( event, ui) {
            videoPlayer.trash(event, ui);
        }
    });

    $('#previousTimelinePage').on("click", function() {
        switch(pageStatus) {
            case RECORDING:
                window.location.href = "pitotiAR.html";
                break;

            case UPLOADING:
                showTimelinePage();
                $('#playControl').show();
                videoPlayer.rewind();
                pageStatus = RECORDING;
                break;

            default:
                break;
        }
    });

    $('#nextARPage').on("click", function() {
        var discard;
        switch(pageStatus) {
            case RECORDING:
                if(videoPlayer.timelineOccupied()) {
                    if(!audioSystem.audioRecorded()) {
                        discard = confirm("No audio recorded! Do you want to continue?");
                        if(!discard) {
                            return;
                        }
                    }
                    showUploadPage();
                    $('#playControl').hide();
                    videoPlayer.rewind();
                    pageStatus = UPLOADING;
                } else {
                    alert("No clips in timeline");
                }
                break;

            case UPLOADING:
                if(!audioSystem.getUploadStatus()) {
                    discard = confirm("This will discard your story!");
                    if(discard) {
                        window.location.href = "pitotiThanks.html";
                    }
                } else {
                    window.location.href = "pitotiThanks.html";
                }
                break;

            default:
                break;
        }
    });

    //Callbacks
    $('#audioRecord').on('click', function() {
        if(!videoPlayer.timelineOccupied()) {
            alert("No clips in timeline!");
            return;
        }
        audioSystem.toggleRecording();
        if(audioSystem.isStopped()) {
            $('#playControl').show();
            audioSystem.ready();
            audioSystem.updateControls();
            videoPlayer.rewind();
        } else {
            $('#playControl').hide();
            videoPlayer.rewind();
            videoPlayer.playBack();
        }
    });

    $('#playStoryFinal').on("click", function() {
        $('#playControl').hide();
        videoPlayer.rewind();
        videoPlayer.playBack();
        audioSystem.rewind();
        audioSystem.playNextBuffer();
    });

    $('#createNewStory').on("click", function() {
        clearSlots();
        window.location.href = "pitotiAR.html";
    });

    $('#playControl').on("click", function() {
        playPauseVideo();
    });

    $('#videoPlayer').on("click", function() {
        if(pageStatus === UPLOADING) return;
        playPauseVideo();
    });

    var gotDetails = false;
    $('#uploadStory').on("click", function() {
        if(gotDetails) {
            uploadStory();
        } else {
            getUserDetails();
        }
    });

    $('#cancelDetails').on("click", function() {
        showUploadPage();
        gotDetails = false;
    });

    //Store user details
    var uploadStatus = false;
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

        showUploadPage();

        uploadStory();
    };

    var index = 0;
    $('[id^=audioButton]').on("click", function() {
        videoPlayer.rewind();
        videoPlayer.playBack();
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
        //DEBUG
        console.log("Selected index ", index);
        audioSystem.selectEntry(index);
    });

});
