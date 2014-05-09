var express = require('express'),
    mongojs = require('mongojs'),
    apns = require("apns"),
    GitHubApi = require("github"),
    socket = require('socket.io');

var app = express(),
    server = app.listen(7000),
    io = socket.listen(server),
    options, connection, notification;


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