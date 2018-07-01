var player;
function pollForYTLoaded() {
    // Before we can create the Player object, it needs to
    // be fully loaded from the server.
    // Ensure that it is loaded before we proceed.
    if (YT.loaded != 1) {
        return setTimeout(pollForYTLoaded, 50);
    }

    player = new YT.Player('vidPlayer', {
        width: '640',
        height: '390',
        videoID: 'wQysqHCAEi4',
        events: {
            onReady: function (e) {
                console.log("Player is ready");
                refreshView();
            },

            onStateChange: function (e) {
                if (e.data === 0) {
                    console.log("started")
                    currentSong += 1
                    if (currentSong < songPlayList.length) {
                        player.loadVideoById(songPlayList[currentSong])
                        player.playVideo();
                    }
                    else {
                        console.log("Playlist has finished")
                    }
                }
            },

            onError: function (e) {
                currentSong += 1
                if (currentSong < songPlayList.length) {
                    player.loadVideoById(songPlayList[currentSong])
                    player.playVideo();
                }
                else {
                    console.log("Playlist has finished")
                }
            }
        }
    });
}
pollForYTLoaded();

var songPlayList = []
var currentSong = 0

document.getElementById("play").addEventListener("click", function () {
    currentSong = 0;
    if (songPlayList[0]) {
        player.loadVideoById(songPlayList[0])
        player.playVideo();
    }
    else {
        console.log("no songs added to playlist")
    }
})

$('#recordSong').on('click', function (e) {
    var url = $('#urlInput').val();
    recordSong(url);
})

document.getElementById("recPlaylistBut").addEventListener("click", function () {
    var playlistSongs = []
    var songs = Array.from(document.getElementById('playlist').childNodes)

    for (song in songs) {
        if (songs[song].classList) {
            if (songs[song].classList.contains('song')) {
                playlistSongs.push(songs[song].value)
            }
        }
    }

    $.ajax({
        data: {
            songs: playlistSongs,
            name: document.getElementById("playListName").value
        },
        type: "POST",
        url: "recordPlaylist"
    })
        .done(function (data) {
            console.log(data)
        })
})


function refreshView() {
    return $.ajax({
        type: "GET",
        dataType: "json",
        url: "/appData"
    })
        .then(function (appData) {
            var songs = $("#songs");
            var playlist = $("#playlist");

            songs.empty();
            playlist.empty();
    
            $.each(appData, function (key, appObject) {
                if (appObject["type"] == "song") {
                    
                    var author = appObject.author;
                    var vidId = appObject.vidID;
                    var title = appObject.title;

                    var song = $("<div/>");
                    var songName = $(`<div>${author}: ${title}</div>`);

                    var songPlay = $(`<button>Play</button>`);
                    songPlay.on('click', function () {
                        player.loadVideoById(vidId);
                        player.playVideo();
                    })

                    var songAdd = $("<button/>");
                    songAdd.text("Add to playlist");
                    songAdd.on('click', function () {
                        songPlayList.push(vidId);
                        var listedSong = $(`<button class="song">${title}</button>`);
                        listedSong.on("click", function () {
                            currentSong = songPlayList.indexOf(vidId);
                            player.loadVideoById(vidId);
                            player.playVideo();
                        })
                        playlist.append(listedSong)
                    });

                    song.append(songName);
                    song.append(songPlay);
                    song.append(songAdd);
                    songs.append(song);
                }
            });
        })
        .catch(function(err){
            console.error(err);
        });
}

function recordSong(url) {
    return $.ajax({
        url: 'https://noembed.com/embed',
        dataType: "json",
        data: { format: 'json', url: url },
    })
        .then(function (data) {
            var videoData = data
            return $.ajax({
                url: "/recordSong",
                type: "POST",
                data: {
                    url: url,
                    vidInfo: JSON.stringify(videoData)
                },
            })
        })
        .catch(function (err) {
            console.error("Unable to record song to database");
            console.error(err);
        })
        .then(refreshView)
}
