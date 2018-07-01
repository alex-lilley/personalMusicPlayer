from flask import Flask, request, render_template, jsonify
import json
import sys
import os

app = Flask(__name__)

musicData = "./musicData.json"
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

@app.route("/", methods=['GET'])
def home():
    return render_template('main.html')

@app.route("/appData", methods=['GET'])
def setup():
    with open(musicData, "r") as jsonFile:
        return jsonFile.read()

@app.route("/recordSong", methods=['POST'])
def recordSong():
    data = json.loads(request.form['vidInfo'])

    url = request.form['url']
    if url:
        if url.find("watch?v="):
            url = url.replace("watch?v=", "")

        if not "embed/" in url:
            url = url.replace(".com/", ".com/embed/")

        vidID = url[-11:]
        url = url + "?enablejsapi=1&amp;origin=http%3A%2F%2F127.0.0.1%3A5000&amp;widgetid=1;autoplay=1"
        songName = data["title"]+"-"+data['author_name']
        newSong = {songName:{"url": url, "author":data['author_name'], 'title':data['title'], "vidID": vidID, "type":"song"}}

        if not os.path.exists(musicData):
            with open(musicData, "w") as  jsonFile:
                json.dump({}, jsonFile, indent=4)

        songList = None
        with open(musicData, "r") as jsonFile:
            try:
                songList = json.load(jsonFile)
            except:
                songList = {}
            songList.update(newSong)

        with open(musicData, "w+") as jsonFile:
            json.dump(songList, jsonFile, indent=4)
            print("added new song to playlist: " + songName, file=sys.stdout)
            return songList[songName]["vidID"]

    else:
        return "url not included in request", 400

@app.route("/recordPlaylist", methods=['POST'])
def recordPlaylist():
    print(request.form, file=sys.stdout)
    playlist ={request.form.getlist('name')[0] :{ 'songs': request.form.getlist('songs[]'), 'type':'playlist'}}
    with open(musicData, "r") as jsonFile:
        collection = json.load(jsonFile)
        collection.update(playlist)
    with open(musicData, 'w') as jsonFile:
        json.dump(collection, jsonFile, indent=4)
    return "sent"