#!/bin/sh

sudo yum update -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install node
nvm use node
node -e "console.log('Running Node.js ' + process.version)"

cd /home/ec2-user
wget https://aws-codedeploy-us-west-2.s3.amazonaws.com/latest/install
chmod +x ./install
./install auto
service codedeploy-agent status
