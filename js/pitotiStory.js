/**
 * Created by atg on 06/11/2015.
 */

var userName;
var buttonIdTag = "playStory";
var userStories = [".\/uploads\/Tony G_0_3_12_1_Thu, 05 Nov 2015 17:26:53 GMT.mp3"];

function displayStories(numStories) {
    var startPlace = $('.page');
    var startName = "row";
    var startRow = 1;
    var currentStory = 1;
    var columnsPerRow = 4;
    var divideClass = "col-md-3";
    var numRows = Math.floor(numStories/columnsPerRow);
    var remainder = numStories % columnsPerRow;

    //Add full rows
    for(var i=0; i<numRows; ++i) {
        startPlace.append(
            $('<div/>')
                .attr("id", "row"+startRow)
                .addClass("row")
        );
        for(var j=0; j<columnsPerRow; ++j) {
            $('#row'+startRow).append(
                $('<div/>')
                    .addClass(divideClass)
                    .html("<p>Story "+currentStory+"</p>")
                    .append(
                        $('<button/>')
                            .addClass("actionButton")
                            .attr("id", buttonIdTag+currentStory)
                            .text("PLAY")
                            .click(function() {
                                console.log("You clicked", this.id);
                            })
                    )
            );
            ++currentStory;
        }
        ++startRow;
    }

    //Add remainder
    switch(remainder) {
        case 1:
            divideClass = "col-md-12";
            break;

        case 2:
            divideClass = "col-md-6";
            break;

        case 3:
            divideClass = "col-md-4";
            break;

        default:
            break;
    }

    if(remainder) {
        startPlace.append(
            $('<div/>')
                .attr("id", "row"+startRow)
                .addClass("row")
        );

        for(i=0; i<remainder; ++i) {
            $('#row'+startRow).append(
                $('<div/>')
                    .addClass(divideClass)
                    .html("<p>Story "+currentStory+"</p>")
                    .append(
                        $('<button/>')
                            .addClass("actionButton")
                            .attr("id", buttonIdTag+currentStory)
                            .text("PLAY")
                            .click(function() {
                                var videos = getVideos(this.id);
                                if(!videos.length) {
                                    console.log("No videos retrieved!");
                                    return;
                                }
                                for(var i= 0,length=videos.length; i<length; ++i) {
                                    sessionStorage.setItem("videoStory"+i, videos[i]);
                                }
                                window.location.href = "pitotiStoryTelling.html";
                            })
                    )
            );
            ++currentStory;
        }
    }

}

function getVideos(storyIndex) {
    storyIndex = storyIndex.substr(buttonIdTag.length);
    storyIndex = parseInt(storyIndex);
    if(isNaN(storyIndex)) {
        console.log("Invalid index!");
        return;
    } else {
        --storyIndex;
    }
    var offset = userName.length;
    var videoNames = userStories[storyIndex];
    var videoIndex = userStories[storyIndex].indexOf(userName);
    if(videoIndex >= 0) {
        videoNames = videoNames.substring(videoIndex+offset, videoNames.length-4);
    }

    var gotVideos = false;
    var currentIndex;
    var numberOffset;
    var videoIndices = [];
    while(!gotVideos) {
        currentIndex = parseInt(videoNames);
        if(isNaN(currentIndex)) {
            gotVideos = true;
        } else {
            videoIndices.push(currentIndex);
            numberOffset = currentIndex >= 10 ? 3 : 2;
            videoNames = videoNames.substr(numberOffset, videoNames.length);
        }
    }
    //Get associated videos
    for(var i=0; i<videoIndices.length; ++i) {
        videoIndices[i] = videoManager.getVideoSource(videoIndices[i], HIGH);
    }

    return videoIndices;
}

$(document).ready(function() {

    var userData = new FormData();


    /*
    $('#nameEntered').on("click", function() {
        var userName = $('#username').val();
        if(!userName) {
            alert("Please enter a username!");
            return;
        }
        userData.append("username", userName);

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "getStories.php", true);
        xhr.onreadystatechange = function() {
            if(xhr.readyState === 4) {
                if(xhr.status === 200) {
                    console.log(xhr.responseText);
                    userStories = JSON.parse(xhr.responseText);
                    console.log("Num stories = ", userStories.length);
                } else {
                    console.log("Error uploading");
                }
            }
        };

        xhr.send(userData);
    });
    */

    $('#nameEntered').on("click", function() {
        var numStories = userStories.length;
        if(numStories === 0) {
            $('#noStories').show();
            return;
        } else {
            displayStories(numStories);
            userName = "Tony G" + "_";
        }
    });

});
