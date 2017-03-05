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
**--platform**  
One or more of `darwin`, `windows` or `linux`. Can be applied multiple times for a parellel platform build.

**--arch**   
We only support `x64` at the moment, but we will be adding support for `arm` processors soon.

**--branch**  
Define which branch to build off of. Defaults to `master`. We create an archive by running `git archive <branch>`, so anything in your `.gitignore` *will not be sent*.

### Example Build Commands
For a Windows only build:

    electrode build --platform windows

For a Windows and Mac build:

    electrode build --platform windows --platform darwin

For a Mac build of x64 off of the development branch:

    electrode build --platform darwin --arch x64 --branch development

# MIT Licence

    Copyright (c) 2017 Tom Hallam

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
