#!/bin/sh

cd /var/node/GithubNotifications/

git pull
forever stop app.js
forever start app.js
