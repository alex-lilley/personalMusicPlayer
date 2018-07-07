import swal from 'sweetalert2'

var player;
function pollForYTLoaded() {
    // Before we can create the Player object, it needs to
    // be fully loaded from the server.
    // Ensure that it is loaded before we proceed.
    if (YT.loaded != 1) {
        return setTimeout(pollForYTLoaded, 50);
    }
    function playNextSong() {
        currentSong += 1;
        if (currentSong < songPlayList.length) {
            player.loadVideoById(songPlayList[currentSong]);
            player.playVideo();
        }
        else {
            console.log("Playlist has finished");
        }
    }

    player = new YT.Player('vid-player', {
        width: 860,
        height: 860 * 9 / 16,
        videoID: 'wQysqHCAEi4',
        events: {
            onReady: function (e) {
                console.log("Player is ready");
                refreshView();
            },

            onStateChange: function (e) {
                if (e.data === YT.PlayerState.ENDED) {
                    console.log("started")
                    playNextSong();
                }
            },

            onError: function (e) {
                playNextSong();
            }
        }
    });
}
pollForYTLoaded();

var songPlayList = []
var currentSong = 0

$("#play").on("click", function () {
    currentSong = 0;
    if (songPlayList[0]) {
        player.loadVideoById(songPlayList[0])
        player.playVideo();
    }
    else {
        console.log("no songs added to playlist")
    }
})

$('#record-song').on('click', function (e) {
    swal({
        input: 'url',
        title: 'Add Song to Songlist',
        inputPlaceholder: 'Enter the URL'
    })
        .then(res => {
            recordSong(res.value)
        });

})

$("#record-playlist").on("click", function () {
    $.ajax({
        data: {
            songs: songPlayList,
            name: $("#playlist-name").val()
        },
        type: "POST",
        url: "recordPlaylist"
    })
        .then(refreshView())
        .catch(err => console.error(err));
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
            var playlists = $("#playlists");
            songs.empty();
            playlist.empty();
            playlists.empty();

            $.each(appData, function (key, appObject) {
                if (appObject["type"] == "song") {

                    var author = appObject.author;
                    var vidId = appObject.vidID;
                    var title = appObject.title;

                    var song = $(`<div class="song" />`);
                    var songControls = $(`<div class="song-controls" />`);
                    var songTitle = $(`<div class="song-title">${title}</div>`);
                    var songAuthor = $(`<div class="song-author sub-text">${author}</div>`);

                    var songPlay = $(`<i class="fas fa-play-circle fa-2x icon-button"></i>`);
                    songPlay.on('click', function () {
                        player.loadVideoById(vidId);
                        player.playVideo();
                    })

                    var songAdd = $(`<i class="fas fa-plus-circle fa-2x icon-button"></i>"`);
                    songAdd.on('click', function () {
                        songPlayList.push(vidId);
                        var listedSong = $(`<button class="song">${title}</button>`);
                        listedSong.on("click", function () {
                            currentSong = songPlayList.indexOf(vidId);
                            player.loadVideoById(vidId);
                            player.playVideo();
                        })
                        playlist.append(listedSong);
                    });

                    songControls.append(songPlay);
                    songControls.append(songAdd);
                    song.append(songControls);
                    song.append(songTitle);
                    song.append(songAuthor);
                    songs.append(song);
                }
                //add playlist retrieval here
                else if (appObject["type"] == "playlist") {
                    var songsList = appObject.songs;
                    var playlistName = `<div>${key}</div>`;
                    var newPlaylist = $("<div/>");

                    var playlistPlay = $("<button>Play all</button>");
                    playlistPlay.on("click", function () {
                        $.each(songsList, function (song) {
                            var songData = appData[songsList[song]];
                            var vidId = songData.vidID
                            songPlayList.push(vidId);

                            var listedSong = $(`<button class="song">${songData.title}</button>`);
                            listedSong.on("click", function () {
                                currentSong = songPlayList.indexOf(vidId);
                                player.loadVideoById(vidId);
                                player.playVideo();
                            })
                            playlist.append(listedSong);
                        })
                    })

                    newPlaylist.append(playlistName)
                    newPlaylist.append(playlistPlay)
                    playlists.append(newPlaylist)
                }
            });
        })
        .catch(function (err) {
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

$("#clear-playlist").on("click", function () {
    songPlayList = [];
    currentSong = 0;
    $("#playlist").empty();
})