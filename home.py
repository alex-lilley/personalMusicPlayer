from flask import Flask, request, render_template, jsonify
import json
import sys
import os

app = Flask(__name__)

initialized_data = {"song":{}, "playlist":{}}
music_data_path = "./musicData.json"
# Prevent flask from caching js for developement
@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r

def get_music_data():
    if not os.path.exists(music_data_path):
            with open(music_data_path, "w") as  json_file:
                json.dump(initialized_data, json_file, indent=4)
   
    with open(music_data_path, "r") as json_file:
        try:
            return json.load(json_file)
        except:
            return initialized_data      

@app.route("/", methods=['GET'])
def home():
    return render_template('main.html')

@app.route("/app_data", methods=['GET'])
def setup():  
    return json.dumps(get_music_data())

@app.route("/record_song", methods=['POST'])
def record_song():
    data = json.loads(request.form['vidInfo'])

    url = request.form['url']
    if url:
        if url.find("watch?v="):
            url = url.replace("watch?v=", "")

        if not "embed/" in url:
            url = url.replace(".com/", ".com/embed/")

        if "?" in url:
            url = url.split("?")[0]

        vid_ID = url[-11:]

        song_name = data["title"]+"-"+data['author_name']
        new_song = {vid_ID:{"url": url, "author":data['author_name'], 'title':data['title'], "vidID": vid_ID, "type":"song"}}

        song_list = get_music_data()
        song_list["song"].update(new_song)
        with open(music_data_path, "w+") as json_file:
            json.dump(song_list, json_file, indent=4)
            print("added new song to playlist: " + song_name, file=sys.stdout)
            return json.dumps(song_list["song"][vid_ID])

    else:
        return "url not included in request", 400

@app.route("/record_playlist", methods=['POST'])
def record_playlist():
    print(request.form, file=sys.stdout)
    playlist_name = request.form.getlist('name')[0]
    songs = request.form.getlist('songs[]')

    if (playlist_name is not None or playlist_name != "") and songs:
        playlist = {playlist_name :{ 'songs': songs, 'type':'playlist'}}

        music_data = get_music_data()
        music_data["playlist"].update(playlist)
        with open(music_data_path, 'w') as json_file:
            json.dump(music_data, json_file, indent=4)
        return "", 200
    else:
        return "incorrect data format sent to server", 400

@app.route("/delete_playlist", methods=['POST'])
def delete_playlist():
    music_data = get_music_data()
    playlist_name = request.form.getlist('playlistName')[0]
    includes_songs = request.form.getlist('includeSongs')[0]

    if includes_songs == '0':
        del music_data["playlist"][playlist_name]
        with open(music_data_path, 'w') as json_file:
            json.dump(music_data, json_file, indent=4)
        print("hero")
    else:
        song_list = music_data["playlist"][playlist_name]['songs'].copy()
        print(music_data["playlist"][playlist_name]['songs'])
        for song in song_list:
            print(song, file=sys.stdout)
            for playlist in music_data["playlist"]:
                if song in music_data["playlist"][playlist]['songs']:
                    music_data["playlist"][playlist]["songs"].remove(song)
                    print(music_data["playlist"][playlist]["songs"])
            del music_data["song"][song]
        del music_data["playlist"][playlist_name]
        with open(music_data_path, 'w') as json_file:
            json.dump(music_data, json_file, indent=4)
    return "", 200

@app.route("/delete_song", methods=["POST"])
def delete_song():
    music_data = get_music_data()
    songId = request.form.getlist('vidId')[0]
    for playlist in music_data["playlist"]:
        print("hello")
        if songId in music_data["playlist"][playlist]['songs']:
            music_data["playlist"][playlist]["songs"].remove(songId)
            print(music_data["playlist"][playlist]["songs"])
    del music_data["song"][songId]
    with open(music_data_path, 'w') as json_file:
            json.dump(music_data, json_file, indent=4)
    return "", 200