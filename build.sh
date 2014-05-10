#!/bin/sh

git pull
forever stop app.js
forever start app.js
