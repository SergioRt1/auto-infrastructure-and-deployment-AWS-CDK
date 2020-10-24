#!/bin/sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install -g node
npm install -g npm

cd /home/ec2-user/react-app
npm install
nohup npm start > /dev/null 2>&1 &
