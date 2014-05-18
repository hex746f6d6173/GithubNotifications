#!/bin/sh

cd /var/node/GithubNotifications/

NODE_ENV=production

git pull
forever stop app.js
forever start app.js
