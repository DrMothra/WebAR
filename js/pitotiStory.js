/**
 * Created by atg on 06/11/2015.
 */

var userName;
var buttonIdTag = "playStory";
var userStories = [".\/uploads\/Tony G_0_3_12_1_Thu, 05 Nov 2015 17:26:53 GMT.mp3"];

function displayStories(userStories, userName) {
    var startPlace = $('.page');
    var startName = "row";
    var numStories = userStories.length;
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
                                var videoIndices = getVideos(userStories, this.id, userName);
                                if(!videoIndices.length) {
                                    console.log("No videos retrieved!");
                                    return;
                                }
                                for(var i= 0,length=videoIndices.length; i<length; ++i) {
                                    sessionStorage.setItem("videoStory"+i, videoIndices[i]);
                                }
                                window.location.href = "./pitotiStoryTelling.html";
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
                                var videoIndices = getVideos(userStories, this.id, userName);
                                if(!videoIndices.length) {
                                    console.log("No videos retrieved!");
                                    return;
                                }
                                for(var i= 0,length=videoIndices.length; i<length; ++i) {
                                    sessionStorage.setItem("videoStory"+i, videoIndices[i]);
                                }
                                window.location.href = "./pitotiStoryTelling.html";
                            })
                    )
            );
            ++currentStory;
        }
    }

}

function getVideos(userStories, storyIndex, userName) {
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
    //DEBUG
    console.log("Video string = ", videoNames);
    var videoIndex = userStories[storyIndex].indexOf(userName);
    if(videoIndex >= 0) {
        videoNames = videoNames.substring(videoIndex+offset, videoNames.length-4);
        //DEBUG
        console.log("Video name now = ", videoNames);
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

    return videoIndices;
}

$(document).ready(function() {

    var userData = new FormData();

    $('#nameEntered').on("click", function() {
        var userName = $('#username').val();
        if(!userName) {
            alert("Please enter a username!");
            return;
        }
        userName += "_";
        userData.append("username", userName);

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "getStories.php", true);
        xhr.onreadystatechange = function() {
            if(xhr.readyState === 4) {
                if(xhr.status === 200) {
                    console.log(xhr.responseText);
                    userStories = JSON.parse(xhr.responseText);
                    displayStories(userStories, userName);
                } else {
                    console.log("Error uploading");
                }
            }
        };

        xhr.send(userData);
    });

    /*
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
    */

});
