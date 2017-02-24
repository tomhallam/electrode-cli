# Electrode
Ever wanted to build your Electron apps remotely? Perhaps you don't have a Windows box kicking around at the moment or you haven't got a Mac? Electrode allows you to solve these headaches and potentially more by offloading Electron builds into our cloud!

We manage the build infrastructure (which includes geniune Macs, Windows instances and some Ubuntu Linux instances) which will allow you to do all of the good stuff including:

* Mac code signing
* Windows builds
* Native module builds with the latest versions of MSBUILD, xcode and more
* More to come!

## Getting started

    npm install -g electrode-cli
 
 Electrode will then be available on your `PATH` as `electrode`. Keep reading for docs on how to use it.
 
## Starting a remote build
First, navigate to your project folder (at the level which contains `package.json`). Electrode will not work unless the application is a geniune Electron app. 

Then:

    electrode build [options]
    
### Build options
    --platform - one of mac, windows or linux. can be applied multiple times for parellel platform builds
    --arch - x64 only at the moment, but more to follow
    --branch - the branch to build. defaults to master.
