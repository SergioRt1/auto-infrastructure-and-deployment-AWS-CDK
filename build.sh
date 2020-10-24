#!/bin/sh

#Run CDK to create an configure the infrastructure
cd infrastructure
cdk synth || exit
cdk deploy --require-approval never || exit
#Create and deploy the code to the infrastructure
mkdir ../build
cd ../build || exit
npx create-react-app dummy-react-app
cd dummy-react-app
#Copy App specification scrips to the created react app folder
cp -r ../../app-specification/* ./
rm -rf node_modules #Remove node dependencies
#Push code
aws deploy push --application-name SimpleReactApp --s3-location s3://my-app-code-in-s3/code.zip
aws deploy create-deployment \
 --application-name SimpleReactApp \
 --deployment-group-name SimpleReactAppDG \
 --deployment-config-name CodeDeployDefault.OneAtATime \
 --s3-location bucket=my-app-code-in-s3,bundleType=zip,key=code.zip
