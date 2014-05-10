var http = require('http'),
    request = require('request'),
    express = require('express'),
    cookie = require('cookie'),
    mongojs = require('mongojs'),
    apns = require("apns"),
    github = require("octonode"),
    socket = require('socket.io');

var config = require("./config.json"),
    app = express(),
    server = app.listen(7000),
    io = socket.listen(server),
    options, connection, notification;

var auth_url = github.auth.config({
    id: '8f59d9448ad24e3484f3',
    secret: 'fe3cef4f26369033280c37de853e8b6815ec589a'
}).login(['user', 'repo', 'gist', 'notifications']);

var db = mongojs('gitnot', ['users']);

var users = db.collection('users');

io.sockets.on('connection', function(socket) {

    var cookies = cookie.parse(socket.handshake.headers['cookie']);

    var status = {
        status: "loggedOUT",
        authURL: auth_url
    };

    if (cookies.gitnot_loggedin) {
        status = {
            status: "loggedIN",
            code: cookies.gitnot_loggedin
        };
        users.findOne({
            time: parseInt(cookies.gitnot_loggedin)
        }, function(err, doc) {
            console.log(err, doc);
            if (doc)
                socket.emit("user", doc.user);
        });
    }
    socket.emit("config", {
        config: config.expose,
        status: status
    });

});

app.use(express.static(__dirname + '/public'));

app.get('/github/callback/', function(req, res) {
    github.auth.login(req.query.code, function(err, token) {
        var client = github.client(token);
        var ghme = client.me();
        ghme.info(function(err, data, headers) {
            var time = new Date().getTime();
            users.save({
                id: data.id,
                user: data,
                token: token,
                time: time
            }, function() {
                res.cookie("gitnot_loggedin", time);
                res.redirect("/");
            });
        });
    });
});