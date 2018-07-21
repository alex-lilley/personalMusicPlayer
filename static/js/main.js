import swal from 'sweetalert2'


function remove(array, element) {
    const index = array.indexOf(element);
    
    if (index !== -1) {
        array.splice(index, 1);
    }
}

var collectionData;

function playNextSong() {
    player.setPlaybackQuality("hd720");
    singleSong = false;
    currentSong += 1;
    if (currentSong < songPlayList.length) {
        player.loadVideoById(songPlayList[currentSong]);
        player.playVideo();
        highLightCurrentSong();
    }

    else {

        if(looping && (songPlayList.length > 0)){
            currentSong = 0;
            player.loadVideoById(songPlayList[currentSong]);
            player.playVideo();
            highLightCurrentSong();
        }

        else {
            console.log("Playlist has finished");
        }
    }
}

var player;
function pollForYTLoaded() {
    // Before we can create the Player object, it needs to
    // be fully loaded from the server.
    // Ensure that it is loaded before we proceed.
    if (YT.loaded != 1) {
        return setTimeout(pollForYTLoaded, 50);
    }

    player = new YT.Player('vid-player', {
        width: 860,
        height: 860 * 9 / 16,
        videoId: '',
        playerVars:{rel:0},
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

$("#collection").hide();
var songPlayList = []
var currentSong = 0
var singleSong = false;
var looping = false;

$("#loop-playlist").on("click",function(){
    if (looping){
        looping = false;
        $("#loop-playlist").css("color", "#888888");
    }
    else {
        looping = true;
        $("#loop-playlist").css("color", "rgba(255, 255, 255, 0.88)");
    }
})

function highLightCurrentSong () {
    $(".playing").removeClass("playing");
    let playinsSong = $("#playlist").children()[currentSong];
    playinsSong.classList.add("playing");
}

$("#start-playlist").on("click", function () {
    startPlaylist();
})

$("#play-all").on("click",function(){
    var playlist = $("#playlist");
    $.each(collectionData["song"], function(key, value){
        let title = value["title"];
        let author = value["author"];
        let vidId = value["vidID"];

        listSong(title, author, vidId, playlist);
        $(`#${vidId}`).addClass("playlist-content")
    })

    startPlaylist();
})

$("#pause-song").on("click", function(){
    if (YT.PlayerState.PLAYING) {
        player.pauseVideo();
    }
})

$("#play-song").on("click", function(){
    if (YT.PlayerState.PAUSED) {
        player.playVideo();
    }
})

function startPlaylist() {
    currentSong = 0;
    if (songPlayList[0]) {
        player.loadVideoById(songPlayList[0]);
        highLightCurrentSong();
        player.playVideo();
    }
    else {
        console.log("no songs added to playlist");
    }
}

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
    swal({
        input: 'text',
        title: 'Add new Playlist',
        inputPlaceholder: 'Enter the new Playlist name',
        showCancelButton: true
    })
        .then(res => { 
            if (res.dismiss) {
                console.log("modal dismissed")
            }
            else {
                recordPlaylist(res.value)
            }
        })


})

function recordPlaylist(playlist) {
    let playlistName = playlist

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
            name: playlistName
        },
        type: "POST",
        url: "record_playlist"
    })
        .then(refreshView())
        .catch(err => console.error(err));
}

$("#previous-song").on("click", function() {
    if(songPlayList.length >= 1){
        if (currentSong > 0){
            currentSong -=1;
        }
        player.loadVideoById(songPlayList[currentSong]);
        highLightCurrentSong();
        player.playVideo();
    } 
})
$("#next-song").on("click", function() {
    playNextSong();
})

function checkPlaylist(songId) {
    if (songPlayList.includes(songId)) {
        return true
    }
    else {
        return false
    }
}

function listSong (title, author, vidId, playlist, parent=false){
    
    songPlayList.push(vidId);

    if(parent){
        parent.addClass("playlist-content");
    }

    var listedSong = $(`<div class="song" />`);
    var listedSongTitle = $(`<div class="song-title">${title}</div>`);
    var listedSongAuthor = $(`<div class="song-author sub-text">${author}</div>`);
    var listedSongControls = $(`<div class=playlist-song-controls />`);
    
    var listedSongPlay = $(`<i class="fas fa-play-circle fa-2x icon-button" title="Play this Song"></i>`);
    listedSongPlay.on("click", function () {
        currentSong = songPlayList.indexOf(vidId);
        player.loadVideoById(vidId);
        highLightCurrentSong();
        player.playVideo();
    })

    var listedSongRemove = $(`<i class="fas fa-ban fa-2x icon-button" title="Delete this song from playlist">
    </i>`)
    listedSongRemove.on("click", function() {
        if (songPlayList.indexOf(vidId) < currentSong){
            currentSong -= 1;
        }
        else if (songPlayList.indexOf(vidId) === currentSong) {
            playNextSong();
            currentSong -= 1;
        }
        remove(songPlayList, vidId);
        $(listedSongRemove).parent().parent().remove();
    })

    listedSong.append(listedSongTitle);
    listedSong.append(listedSongAuthor);
    listedSongControls.append(listedSongPlay);
    listedSongControls.append(listedSongRemove);
    listedSong.append(listedSongControls)
    playlist.append(listedSong);
}

function refreshView() {
    return $.ajax({
        type: "GET",
        dataType: "json",
        url: "/app_data"
    })
        .then(function (appData) {
            collectionData = appData;
            var collection = $("#collection");
            var playlist = $("#playlist");
            var playlists = $("#playlists");
            collection.empty();
            // playlist.empty();
            playlists.empty();

            $.each(appData["song"], function (key, appObject) {

                var title = appObject.title;
                var author = appObject.author;
                var vidId = appObject.vidID;

                var song = $(`<div class="song" id="${vidId}" />`);
                var songControls = $(`<div class="song-controls" />`);
                var songTitle = $(`<div class="song-title">${title}</div>`);
                var songAuthor = $(`<div class="song-author sub-text">${author}</div>`);

                var songPlay = $(`<i class="fas fa-play-circle fa-2x icon-button" title="Play this Song"></i>`);
                songPlay.on('click', function () {
                    if (!singleSong) {
                        currentSong -= 1;
                        singleSong = true;
                    }
                    $(".playlist-content").removeClass("playlist-content");
                    player.loadVideoById(vidId);
                    player.playVideo();
                    
                })

                var songAdd = $(`<i class="fas fa-plus-circle fa-2x icon-button" title="Add song to current playlist"></i>"`);
                songAdd.on('click', function () {
                    if(!checkPlaylist(vidId)) {
                        listSong(title, author, vidId, playlist, $(this).parent().parent());
                    }        

                });

                var songDelete = $(`<i class="fas fa-ban fa-2x icon-button" title="Delete this song">
                </i>`)

                songDelete.on("click", function() {
                    swal({
                        title:song.title,
                        text:"Are you sure you want to delete this Song",
                        showCancelButton:true
                    })
                    .then(res =>  {
                        if (res.dismiss) {
                            console.log("modal dismissed")
                        }
                        else {
                            $.ajax({
                                data:{
                                    vidId:vidId
                                },
                                type:"POST",
                                url:"/delete_song"
                                
                            })
                            .then(refreshView())
                        }
                    })
                })

                songControls.append(songDelete);
                songControls.append(songPlay);
                songControls.append(songAdd);
                song.append(songControls);
                song.append(songTitle);
                song.append(songAuthor);
                collection.append(song);
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
                    $(this).parent().parent().addClass("playlist-content");

                    $.each(songsList, function (song) {
                        var songData = appData["song"][songsList[song]];
                        var title = songData["title"];
                        var author = songData["author"];
                        var vidId = songData.vidID;
                        if(!checkPlaylist(vidId)) {
                            $(`#${vidId}`).addClass("playlist-content")
                            listSong(title, author, vidId, playlist, $(this).parent().parent());
                        }
                    })
                })

                var playlistDelete = $(`<i class="fas fa-ban fa-2x icon-button" title="Delete this playlist">
                </i>`)

                playlistDelete.on("click", function() {
                    swal({
                        title:key,
                        text:"Are you sure you want to delete this playlist",
                        input:"checkbox",
                        inputPlaceholder: "Also delete songs in playlist from collection",
                        showCancelButton:true
                    })
                    .then(res =>  {
                        if (res.dismiss) {
                            console.log("modal dismissed")
                        }
                        else {
                            $.ajax({
                                data:{
                                    includeSongs:res.value,
                                    playlistName:key
                                },
                                type:"POST",
                                url:"/delete_playlist"
                                
                            })
                            .then(refreshView())
                        }
                    })
                })

                playlistControls.append(playlistDelete);
                playlistControls.append(playlistPlay);
                newPlaylist.append(playlistControls);
                newPlaylist.append(playlistName);
                newPlaylist.append(playlistSongCount);
                playlists.append(newPlaylist);
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
                url: "/record_song",
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
    $(".playlist-content").removeClass("playlist-content");
})


var shown = "playlists"

$("#show-playlists").on("click", function(){
    shown = "playlists";
    $("#playlists").show();
    $("#collection").hide();
})

$("#show-collection").on("click", function(){
    shown = "collection";
    $("#playlists").hide();
    $("#collection").show();
})

$('#filter-collection').on("keyup", function () {
    var filterString = $('#filter-collection').val().toLowerCase();
    if (shown === "collection"){
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
    }
    else if (shown === "playlists") {
        $.each($(".playlist"), function (index, playlist) {
            var playlistName = $(playlist).find(".playlist-name").text();
            if (playlistName.indexOf(filterString) === -1){
                playlist.style.display = "none";
            }
            else {
                playlist.style.display = "block";
            }
        })
    }
})
