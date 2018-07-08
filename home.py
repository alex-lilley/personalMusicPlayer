from flask import Flask, request, render_template, jsonify
import json
import sys
import os

app = Flask(__name__)

initializedData = {"song":{}, "playlist":{}}
musicDataPath = "./musicData.json"
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

def getMusicData():
    if not os.path.exists(musicDataPath):
            with open(musicDataPath, "w") as  jsonFile:
                json.dump(initializedData, jsonFile, indent=4)
   
    with open(musicDataPath, "r") as jsonFile:
        try:
            return json.load(jsonFile)
        except:
            return initializedData      

@app.route("/", methods=['GET'])
def home():
    return render_template('main.html')

@app.route("/appData", methods=['GET'])
def setup():  
    return json.dumps(getMusicData())

@app.route("/recordSong", methods=['POST'])
def recordSong():
    data = json.loads(request.form['vidInfo'])

    url = request.form['url']
    if url:
        if url.find("watch?v="):
            url = url.replace("watch?v=", "")

        if not "embed/" in url:
            url = url.replace(".com/", ".com/embed/")

        if "?" in url:
            url = url.split("?")[0]

        vidID = url[-11:]

        songName = data["title"]+"-"+data['author_name']
        newSong = {vidID:{"url": url, "author":data['author_name'], 'title':data['title'], "vidID": vidID, "type":"song"}}

        songList = getMusicData()
        songList["song"].update(newSong)
        with open(musicDataPath, "w+") as jsonFile:
            json.dump(songList, jsonFile, indent=4)
            print("added new song to playlist: " + songName, file=sys.stdout)
            return json.dumps(songList["song"][vidID])

    else:
        return "url not included in request", 400

@app.route("/recordPlaylist", methods=['POST'])
def recordPlaylist():
    print(request.form, file=sys.stdout)
    playlist_name = request.form.getlist('name')[0]
    songs = request.form.getlist('songs[]')

    if (playlist_name is not None or playlist_name != "") and songs:
        playlist = {playlist_name :{ 'songs': songs, 'type':'playlist'}}

        musicData = getMusicData()
        musicData["playlist"].update(playlist)
        with open(musicDataPath, 'w') as jsonFile:
            json.dump(musicData, jsonFile, indent=4)
        return "", 200
    else:
        return "incorrect data format sent to server", 400