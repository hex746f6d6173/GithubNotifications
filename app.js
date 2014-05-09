var express = require('express'),
    mongojs = require('mongojs'),
    apns = require("apns"),
    GitHubApi = require("github");

var app = express(),
    options, connection, notification;

app.use(express.static(__dirname + '/public'));

app.listen(7000);