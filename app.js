var express = require('express'),
    cookie = require('cookie'),
    mongojs = require('mongojs'),
    apns = require("apns"),
    GitHubApi = require("github"),
    socket = require('socket.io');

var config = require("./config.json"),
    app = express(),
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

io.sockets.on('connection', function(socket) {

    var cookies = cookie.parse(socket.handshake.headers['cookie']);

    var logged = "loggedOUT";

    if (cookies.github_auth)
        logged = cookies.github_auth;

    socket.emit("config", {
        config: config.expose,
        logged: logged
    });

    /*
    socket.emit("notification", {
        id: "asdfasdfasdfasf",
        payload: {
            title: "GithubNotifications",
            message: "GithubNotifications"
        }
    });
	*/
});

app.use(express.static(__dirname + '/public'));
app.get('/github/callback/', function(req, res) {
    res.cookie('github_auth', req.params.code);
    res.redirect("/");
});