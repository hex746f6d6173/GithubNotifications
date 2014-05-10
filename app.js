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
    io = socket.listen(server, {
        log: false
    }),
    options, connection, notification;

var auth_url = github.auth.config({
    id: '8f59d9448ad24e3484f3',
    secret: 'fe3cef4f26369033280c37de853e8b6815ec589a'
}).login(['user', 'repo', 'gist', 'notifications']);

var db = mongojs('gitnot', ['users', 'notifications', 'hooks']);

var GitNot = {
    users: db.collection('users'),
    notifications: db.collection('notifications'),
    hooks: db.collection('hooks'),
    user: {
        EmitConfig: function(status, config, socket) {
            socket.emit("config", {
                config: config.expose,
                status: status
            });
        },
        findByUID: function(uid, fn) {
            GitNot.users.findOne({
                uid: uid
            }, fn);
        },
        find: function(a, fn) {
            GitNot.users.findOne(a, fn);
        },
        getNotifications: function(uid, fn) {
            GitNot.notifications.find({
                uid: uid
            }).sort({
                time: -1
            }, fn);
        },
        findAll: function(fn) {
            GitNot.users.find(fn);
        }
    },
    notify: {
        socketHooks: {},
        getSocketHook: function(uid) {
            return GitNot.notify.socketHooks[uid];
        },
        setSocketHook: function(uid, socket) {
            GitNot.notify.socketHooks[uid] = socket;
        },
        removeSocketHook: function(uid) {
            GitNot.notify.socketHooks[uid] = null;
        },
        getHooks: function(uid, fn) {
            GitNot.hooks.find({
                uid: uid
            }, fn);
        },
        addHook: function(a, fn) {
            GitNot.hooks.findOne(a, function(err, doc) {
                if (!doc)
                    GitNot.hooks.save(a);
            });
        },
        removeHook: function(a, fn) {
            GitNot.hooks.remove(a);
        },
        sendNotification: function(uid, id, payload) {
            payload.seen = false;
            payload.sent = false;
            GitNot.notifications.save(payload);
            var socketHook = GitNot.notify.getSocketHook(uid);
            console.log("NOTIFY", socketHook);
            if (socketHook) {
                // inmidiate push
                socketHook.emit("notification", payload);
            } else {
                // delayed push
            }
        },
        seen: function(a) {
            GitNot.notifications.update({
                id: a.id
            }, {
                $set: {
                    seen: true
                }
            }, {}, function() {

            });
        },
        update: function(id, uid, payload) {

        }
    }
};

io.sockets.on('connection', function(socket) {

    var user = {};

    socket.on("login", function() {

        user.status = {
            status: "loggedOUT",
            authURL: auth_url
        };

        user.cookies = cookie.parse(socket.handshake.headers['cookie']);

        if (user.cookies.gitnot_loggedin) {
            if (user.cookies.gitnot_loggedin > 5) {
                user.status = {
                    status: "loggedIN",
                    code: user.cookies.gitnot_loggedin
                };

                GitNot.user.findByUID(parseInt(user.cookies.gitnot_loggedin), function(err, doc) {
                    if (doc) {
                        user.uid = doc.uid;
                        socket.emit("user", {
                            user: doc.user,
                            uid: doc.uid
                        });
                        GitNot.notify.setSocketHook(doc.uid, socket);
                    } else {
                        socket.emit("logout");
                    }
                });
            }
        }

        GitNot.user.EmitConfig(user.status, config, socket);
    });

    socket.on("getList", function() {
        if (user.uid)
            GitNot.user.getNotifications(user.uid, function(err, docs) {
                socket.emit("getListRes", docs);
            });
    });

    socket.on("seen", function(data) {
        GitNot.notify.seen(data);
    });

    socket.on('disconnect', function() {
        GitNot.notify.removeSocketHook(user.uid);
    });

});

app.use(express.static(__dirname + '/public'));

app.get('/logout', function(req, res) {
    res.cookie("gitnot_loggedin", 0);
    res.redirect("/");
});

function scrobNotifications() {
    console.log("Get Notifications");
    GitNot.user.findAll(function(err, userDocs) {
        userDocs.forEach(function(userDoc) {

            var client = github.client(userDoc.token);

            var notifications = client.get("/notifications", {}, function(err, status, body, headers) {
                body.forEach(function(item) {

                    var time = new Date(item.updated_at).getTime();

                    GitNot.notifications.findOne({
                        id: item.id
                    }, function(err, doc) {
                        if (!doc) {
                            GitNot.notify.sendNotification(userDoc.uid, item.id, {
                                uid: userDoc.uid,
                                id: item.id,
                                time: time,
                                payload: item
                            });
                        }
                    });
                });
            });
        });
    });
}
scrobNotifications();
setInterval(function() {
    scrobNotifications();
}, 100000);

app.get('/github/callback/', function(req, res) {
    github.auth.login(req.query.code, function(err, token) {
        var client = github.client(token);
        var ghme = client.me();
        ghme.info(function(err, data, headers) {
            var time = new Date().getTime();
            GitNot.user.find({
                id: data.id
            }, function(err, doc) {
                if (doc) {
                    res.cookie("gitnot_loggedin", doc.uid);
                    res.redirect("/");
                } else {
                    GitNot.users.save({
                        id: data.id,
                        user: data,
                        token: token,
                        code: req.query.code,
                        uid: time,
                    }, function() {
                        res.cookie("gitnot_loggedin", time);
                        res.redirect("/");
                    });
                }
            });
        });
    });
});