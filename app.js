var express = require('express'),
    mongojs = require('mongojs'),
    apns = require("apns"),
    GitHubApi = require("github"),
    socket = require('socket.io');

var app = express(),
    server = app.listen(7000),
    io = socket.listen(server),
    options, connection, notification;

var github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    debug: true,
    protocol: "https",
    host: "gitnot.tomasharkema.nl",
    pathPrefix: "/api/v3", // for some GHEs
    timeout: 5000
});
/*
github.authorization.create({
    scopes: ["user", "public_repo", "repo", "repo:status", "gist"],
    note: "what this auth is for",
    note_url: "http://gitnot.tomasharkema.nl",
    headers: {
        "X-GitHub-OTP": "two-factor-code"
    }
}, function(err, res) {
    if (res.token) {
        //save and use res.token as in the Oauth process above from now on
        console.log(res);
    }
});
*/
io.sockets.on('connection', function(socket) {

    socket.emit("notification", {
        id: "asdfasdfasdfasf",
        payload: {
            title: "GithubNotifications",
            message: "GithubNotifications"
        }
    });
    setTimeout(function() {
        socket.emit("notification", {
            id: "asdff",
            payload: {
                title: "GithubNotifications",
                message: "GithubNotifications"
            }
        });
    }, 4000);
});

app.use(express.static(__dirname + '/public'));

app.get('/callback', function(req, res) {
    res.send('hello world');
});