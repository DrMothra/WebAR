/**
 * Created by DrTone on 14/05/2015.
 */

var audio_context, recorder, recording = false;

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
        var url = URL.createObjectURL(blob);
        var li = document.createElement('li');
        var au = document.createElement('audio');

        au.controls = true;
        au.src = url;
        li.appendChild(au);
        audioRecordings.appendChild(li);
    });
}

function toggleRecording() {
    //Start/stop recording
    if(!recorder) return;

    recording = !recording;
    if(recording) {
        console.log("Recording...");

        recorder.record();
    } else {
        recorder.stop();
        console.log("Stopped recording");
        createLink();
        recorder.clear();
    }
}

$(document).ready(function() {
    //Load videos into player
    var player;
    var video = sessionStorage.getItem('video0');
    if(video) {
        player = document.getElementById('videoPlayer');
        if(player) {
            var source = document.createElement("source");
            source.setAttribute("src", video);
            player.appendChild(source);
        }
    }

    //Set up audio recording
    try {
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        audio_context = new AudioContext;
        console.log('Audio context set up.');
        console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
        alert('No web audio support in this browser!');
    }

    navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
        alert('No live audio input: ' + e);
    });

    //Callbacks
    $('#audioRecord').on('click', function() {
        toggleRecording();
    });
});
