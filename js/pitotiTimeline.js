/**
 * Created by DrTone on 07/07/2015.
 */
var NUM_CONTAINERS = 8;
var TIMELINE_SLOTS = 4;
var MAX_VIDEO_TIME = 60;
var STOPPED=0, PLAYING=1, PAUSED=2;

var videoPanel = (function() {
    //Timeline
    var timelineSlots = new Array(TIMELINE_SLOTS);
    var videoSources = new Array(TIMELINE_SLOTS);
    for(var i=0; i<TIMELINE_SLOTS; ++i) {
        timelineSlots[i] = false;
    }
    var videoStatus = STOPPED;
    var numVideos = 0;
    var checkInterval = 1000;
    var videoChecker;
    var dragImage, dragTrashImage;
    var progressBar;
    var currentElapsed = 0;
    var timelineOccupied = false;
    var currentPlayer = -1;
    var videoWidth, videoHeight;
    var videoPlayer;

    return {
        init: function() {
            //Fill video slots
            var i, src, elem;
            for(i=0; i<NUM_CONTAINERS; ++i) {
                src = sessionStorage.getItem("slot" + i);
                if(src) {
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
            console.log("Width =", imageWidth);
            dragImage.style.zIndex = "100";

            dragTrashImage = document.createElement("img");
            dragTrashImage.src = "images/dragTrash.png";
            dragTrashImage.style.width = imageWidth+"px";
            dragImage.style.zIndex = "100";

            //Video containers
            var vidElem = document.getElementById("timeline0");
            videoWidth = vidElem ? vidElem.clientWidth : window.innerWidth * 0.09;
            videoHeight = vidElem ? vidElem.clientHeight : window.innerHeight * 0.09;

            progressBar = document.getElementById("elapsed");
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
            ++numVideos;
            sessionStorage.setItem("numVideos", numVideos);
            sessionStorage.setItem("timeline"+slot, "video"+videoIndex);
            //Enable next again
            this.setTimelineOccupied(true);
            this.setPlayerSource(videoIndex);
        },

        setPlayerSource: function(index) {
            for(var i=0; i<TIMELINE_SLOTS; ++i) {
                if(timelineSlots[i]) {
                    videoPlayer.src = videoManager.getVideoSource(index);
                    return;
                }
            }
        },

        playStory: function() {
            if(videoStatus === PAUSED) {
                if(currentPlayer >= 0) {
                    videoPlayers[currentPlayer].play();
                    videoStatus = PLAYING;
                    return true;
                }
            }
            currentElapsed = 0;
            var slotId, containsVideo=false, videoIndex, videoId;
            for(var i=0; i<TIMELINE_SLOTS; ++i) {
                slotId = document.getElementById("timeline"+i);
                if(slotId.src.indexOf("video") >= 0) {
                    containsVideo = true;
                    videoPlayers[i].empty = false;
                    //Get index
                    var videoName = slotId.src.substring(0, slotId.src.length-4);
                    var number = true;
                    var index = videoName.length - 1;
                    var value;
                    while(number) {
                        value = parseInt(videoName.charAt(index));
                        if(isNaN(value)) {
                            number = false;
                        }
                        --index;
                    }
                    videoIndex = parseInt(videoName.substring(index+2, videoName.length));

                    //DEBUG
                    console.log("Index = ", videoIndex);

                    videoPlayers[i].src = videoManager.getVideoSource(videoIndex);
                    $('#timeline'+i).hide();
                    $('#timelineVideo'+i).show();
                } else {
                    videoPlayers[i].empty = true;
                }
            }
            if(!containsVideo) {
                alert("No videos in timeline");
                return false;
            } else {
                for(var i=0; i<TIMELINE_SLOTS; ++i) {
                    if(!videoPlayers[i].empty) {
                        currentPlayer = i;
                        videoPlayers[i].play();
                        videoStatus = PLAYING;
                        break;
                    }
                }
                videoChecker = setInterval(function() {
                    if(videoPlayers[currentPlayer].ended) {
                        ++currentPlayer;
                        currentElapsed = currentPlayer * 15;
                        var playing = false;
                        for(var i=currentPlayer; i<TIMELINE_SLOTS; ++i) {
                            if(!videoPlayers[i].empty) {
                                playing = true;
                                currentPlayer = i;
                                videoPlayers[i].play();
                                break;
                            } else {
                                currentElapsed += 15;
                            }
                        }
                        if(!playing) {
                            for(var i=0; i<TIMELINE_SLOTS; ++i) {
                                $('#timeline'+i).show();
                                $('#timelineVideo'+i).hide();
                            }
                            progressBar.value = MAX_VIDEO_TIME;
                            $('#playStory').show();
                            $('#pauseStory').hide();
                            clearInterval(videoChecker);
                        }
                    } else {
                        if(videoStatus != PAUSED) {
                            progressBar.value = ++currentElapsed;
                        }
                    }

                }, checkInterval);
                return true;
            }
        },

        pauseStory: function() {
            if(currentPlayer >= 0) {
                videoPlayers[currentPlayer].pause();
                videoStatus = PAUSED;
            }
        },

        trash: function(event, ui) {
            var dragged = $(ui.draggable);
            var id = dragged.attr('id');
            var slot = parseInt(id.charAt(id.length-1));
            if(isNaN(slot)) return;

            timelineSlots[slot] = false;
            --numVideos;
            sessionStorage.setItem("numVideos", numVideos);
            sessionStorage.removeItem("timeline"+slot);
            //Restore original image
            var timelineSlot = document.getElementById("timeline"+slot);
            timelineSlot.src = "images/emptyTimeline.png";
            if(numVideos === 0) {
                videoPanel.setTimelineOccupied(false);
            }
        },

        setTimelineOccupied: function(occupied) {
            timelineOccupied = occupied;
        },

        timelineOccupied: function() {
            return timelineOccupied;
        }
    }
})();


$(document).ready(function() {
    //Init
    videoPanel.init();

    var dragElem = $('.drag img');
    dragElem.draggable( {
        revert: "invalid",
        helper: function(event) {
            return videoPanel.getDragImage();
        }
    });

    var dragTimeline = $('.timeDrop img');
    dragTimeline.draggable( {
            revert: "invalid",
        helper: function(event) {
            return videoPanel.getDragTrashImage();
        }
    });

    var targetElem = $('img[id^=timeline]');
    targetElem.droppable( {
        accept: ".drag img",
        drop: function( event, ui) {
            videoPanel.drop(event, ui);
        }
    });

    var trashElem = $('#timeTrash');
    trashElem.droppable( {
        accept: ".timeDrop img",
        drop: function( event, ui) {
            videoPanel.trash(event, ui);
        }
    });

    $('#nextARPage').on("click", function() {
        if(videoPanel.timelineOccupied()) {
            window.location.href = "pitotiRecord.html";
        } else {
            alert("No clips in timeline");
        }
    });

    var playElem = $('#playStory');
    var pauseElem = $('#pauseStory');
    playElem.on("click", function() {
        if(videoPanel.playStory()) {
            playElem.hide();
            pauseElem.show();
        }
    });

    pauseElem.on("click", function() {
        videoPanel.pauseStory();
        pauseElem.hide();
        playElem.show();
    });
});
