#!/bin/sh

rm -rf build/
cd infrastructure || exit
cdk destroy -y
