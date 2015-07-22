/**
 * Created by DrTone on 07/07/2015.
 */
var NUM_CONTAINERS = 8;
var TIMELINE_SLOTS = 4;

var videoPanel = (function() {
    //Timeline
    var timelineSlots = new Array(TIMELINE_SLOTS);
    for(var i=0; i<TIMELINE_SLOTS; ++i) {
        timelineSlots[i] = false;
    }
    var videoSources = ['videos/HuntSmall.mp4', 'videos/deersSmall.mp4', 'videos/HouseSmall.mp4'];
    var videosToPlay = [];
    var numVideos = 0;
    var checkInterval = 1000;
    var videoChecker;
    var dragImage, dragTrashImage;

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
            //Dragged elements
            var elem = document.getElementById("slot0");
            dragImage = document.createElement("img");
            dragImage.src = "images/dragTimeline.png";
            dragImage.style.width = elem.clientWidth+"px";

            dragTrashImage = document.createElement("img");
            dragTrashImage.src = "images/dragTrash.png";
            dragTrashImage.style.width = elem.clientWidth+"px";
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
            //Get video index
            var videoIndex = parseInt(image.src.charAt(image.src.length-5));
            timelineSlots[slot] = true;
            ++numVideos;
            sessionStorage.setItem("numVideos", numVideos);
            sessionStorage.setItem("timeline"+slot, "video"+videoIndex);
            //Enable next again
            $('#nextARPage').removeClass("notActive");
        },

        playStory: function() {
            var slotId, containsVideo=false, videoIndex;
            for(var i=0; i<TIMELINE_SLOTS; ++i) {
                slotId = document.getElementById("timeline"+i);
                if(slotId.src.indexOf("video") >= 0) {
                    containsVideo = true;
                    videoIndex = parseInt(slotId.src.charAt(slotId.src.length-5));
                    if(isNaN(videoIndex)) continue;
                    videosToPlay.push(videoSources[videoIndex]);
                }
            }
            if(!containsVideo) {
                alert("No videos in timeline");
            } else {
                var player = document.getElementById("videoPlayer");
                $('#timeline').hide();
                $('#videoPlayer').show();
                player.src = videosToPlay[0];
                player.play();
                videoChecker = setInterval(function() {
                    if(player.ended) {
                        //See if any more clips
                        videosToPlay.shift();
                        if(videosToPlay.length != 0) {
                            player.src = videosToPlay[0];
                            player.play();
                        } else {
                            clearInterval(videoChecker);
                            $('#timeline').show();
                            $('#videoPlayer').hide();
                        }
                    }
                }, checkInterval);
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
            timelineSlot.src = "images/story"+slot+".png";
            if(numVideos === 0) {
                $('#nextARPage').addClass("notActive");
            }
        }
    }
})();


$(document).ready(function() {
    //Init
    skel.init();

    videoPanel.init();

    var dragElem = $('.drag img');
    dragElem.draggable( {
        revert: "invalid",
        helper: function(event) {
            return videoPanel.getDragImage();
        }
    });

    var dragTimeline = $('.drop img');
    dragTimeline.draggable( {
            revert: "invalid",
        helper: function(event) {
            return videoPanel.getDragTrashImage();
        }
    });

    var targetElem = $('.drop img');
    targetElem.droppable( {
        accept: ".drag img",
        drop: function( event, ui) {
            videoPanel.drop(event, ui);
        }
    });

    var trashElem = $('.trash');
    trashElem.droppable( {
        accept: ".drop img",
        drop: function( event, ui) {
            videoPanel.trash(event, ui);
        }
    });

    $('#playStory').on("click", function() {
        videoPanel.playStory();
    });
});
