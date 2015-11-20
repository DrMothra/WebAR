/**
 * Created by atg on 06/11/2015.
 */

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
                            .attr("id", "playStory"+currentStory)
                            .text("PLAY")
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
                            .attr("id", "playStory"+currentStory)
                            .text("PLAY")
                            .click(function() {
                                console.log("You clicked", this.id);
                            })
                    )
            );
            ++currentStory;
        }
    }

}

function getVideos(videoNames) {
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
    var videoSources = ['videos/axeMan.mp4', 'videos/deers.mp4', 'videos/horseWarrior.mp4', 'videos/house.mp4', 'videos/manHorse.mp4', 'videos/manBeasts.mp4',
        'videos/manHunt.mp4', 'videos/warrior1.mp4', 'videos/marching.mp4', 'videos/morph.mp4', 'videos/headDress.mp4', 'videos/spearHunt.mp4', 'videos/tallMorph.mp4',
        'videos/manuel.mp4', 'videos/warrior2.mp4', 'videos/plough.mp4'];

    for(var i=0; i<videoIndices.length; ++i) {
        videoIndices[i] = videoSources[videoIndices[i]];
    }

    return videoIndices;
}

$(document).ready(function() {

    var userData = new FormData();
    var userStories = [".\/uploads\/Tony G_0_3_12_1_Thu, 05 Nov 2015 17:26:53 GMT.mp3"];

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
            var userName = "Tony G" + "_";
            var offset = userName.length;
            var videoNames = userStories[0];
            var videoIndex = userStories[0].indexOf(userName);
            if(videoIndex >= 0) {
                videoNames = videoNames.substring(videoIndex+offset, videoNames.length-4);
                var videos = getVideos(videoNames);
            }
        }
    });

});
