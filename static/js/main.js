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
var collectionData;

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
        inputPlaceholder: 'Enter the URL',
        showCancelButton: true
    })
        .then(res => {
            if (res.dismiss) {
                console.log("modal dismissed")
            }
            else {
                recordSong(res.value)
            }
        });

})

$("#record-playlist").on("click", function () {
    let playlistName = $("#playlist-name").val().trim();

    if (playlistName == null || playlistName.length === 0) {
        console.error("no name entered");
        return;
    }
    if (songPlayList.length == 0) {
        console.error("no songs in playlist");
        return;
    }
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
            collectionData = appData;
            var songs = $("#songs");
            var playlist = $("#playlist");
            var playlists = $("#playlists");
            songs.empty();
            playlist.empty();
            playlists.empty();

            $.each(appData["song"], function (key, appObject) {

                var author = appObject.author;
                var vidId = appObject.vidID;
                var title = appObject.title;

                var song = $(`<div class="song" />`);
                var songControls = $(`<div class="song-controls" />`);
                var songTitle = $(`<div class="song-title">${title}</div>`);
                var songAuthor = $(`<div class="song-author sub-text">${author}</div>`);

                var songPlay = $(`<i class="fas fa-play-circle fa-2x icon-button" title="Play this Song"></i>`);
                songPlay.on('click', function () {
                    player.loadVideoById(vidId);
                    player.playVideo();
                })

                var songAdd = $(`<i class="fas fa-plus-circle fa-2x icon-button" title="Add song to current playlist"></i>"`);
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
            });

            // Add playlist retrieval here
            $.each(appData["playlist"], function (key, appObject) {
                var songsList = appObject.songs;
                var playlistName = `<div class="playlist-name">${key}</div>`;
                var playlistSongCount = `<div class="playlist-song-count sub-text">Total songs: ${songsList.length}</div>`;
                var newPlaylist = $(`<div class="playlist"/>`);
                var playlistControls = $(`<div class="playlist-controls" />`);

                var playlistPlay = $(`<i class="fas fa-play-circle fa-2x icon-button" title="Play this playlist"></i>`);
                playlistPlay.on("click", function () {
                    $.each(songsList, function (song) {
                        var songData = appData["song"][songsList[song]];
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

                playlistControls.append(playlistPlay)
                newPlaylist.append(playlistControls)
                newPlaylist.append(playlistName)
                newPlaylist.append(playlistSongCount)
                playlists.append(newPlaylist)
            })

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

$('#filter-songs').on("keyup", function () {
    var filterString = $('#filter-songs').val().toLowerCase();
    $.each($(".song"), function (index, song) {
        var songTitle = $(song).find(".song-title").text().toLowerCase();
        var songAuthor = $(song).find(".song-author").text().toLowerCase();
        if (songTitle.indexOf(filterString) === -1 && songAuthor.indexOf(filterString) === -1) {
            song.style.display = "none";
        }
        else {
            song.style.display = "block";
        }
    })
})