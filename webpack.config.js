const webpack = require("webpack");
const path = require("path");

var jsFolder = path.resolve(__dirname, "./static/js");
var buildFolder = path.resolve(__dirname, "./static");

var config = {
    entry: {
        "main":jsFolder+"/main.js",
    },
    output:{
        filename:"[name]bundle.js",
        path:buildFolder
    },
    plugins:[
        new webpack.ProvidePlugin({
        $:"jquery",
        jQuery:"jquery"
        })
    ]
};

module.exports = config;