const path = require('path');
const fs = require('fs');
const cp = require('child_process');

// eslint-disable-next-line
const colors = require('colors');

const request = require('request-promise');
const inquirer = require('inquirer');
const minimist = require('minimist');
const ora = require('ora');

const pkg = require('./package.json');

const args = process.argv.slice(2);
const argv = minimist(args);
const task = args[0];

const options = {
  baseUrl: 'https://electrode.cleverthings.io',
  platforms: argv.platform || ['mac'],
  arch: argv.arch || 'x64'
};

// Default ora spinner (used in build step)
const spinner = ora('Electrode CLI');

//
let userCredentials = {};
let packageJSON = {};
let apiKey = null;

// Check that the current working directory contains an Electron project
const validateWorkingDirectory = () => {

  return new Promise((resolve, reject) => {

    try {

      // eslint-disable-next-line
      const pkg = require(path.join(process.cwd(), 'package.json'));
      if (!pkg.devDependencies || !pkg.devDependencies.electron) return reject('This directory contains a Node.js project, but not one that depends on Electron.');

      packageJSON = pkg;
      return resolve();

    } catch (e) {
      return reject('Could not validate current directory as Electron project. Please ensure you\'re in the right place (try issuing pwd)');
    }

  });

};

// Prompt the user for their credentials which we will use to register and authenticate them
const getCredentials = () => {

  return new Promise((resolve, reject) => {

    const credsQuestions = [
      {
        type: 'input',
        name: 'email',
        message: 'Please enter your email address'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Please enter a password to secure your builds, or the password you chose before.'
      }
    ];

    return inquirer.prompt(credsQuestions).then((creds) => {
      return resolve(creds);
    }).catch((e) => {
      return reject(e);
    });

  });

};

// Validate the user's creds
const verifyCredentials = (creds) => {

  if (!creds.email || !creds.password) {
    console.error('✋  You need to enter a username and password!');
    process.exit(1);
  }

  userCredentials = creds;
  return Promise.resolve();

};

// Actually perform the registration on the remote server
const doRegister = () => {

  const registerRequestOptions = {
    method: 'POST',
    uri: `${options.baseUrl}/register`,
    body: userCredentials,
    json: true,
  };

  return request(registerRequestOptions).catch((response) => {
    if (response.error.name === 'ValidationError') {
      // for now assume this is because we're already registered
      return Promise.resolve();
    }
    return Promise.reject(response);
  });

};

// Perform the authentication on the remote server
const doAuth = () => {

  const registerRequestOptions = {
    method: 'POST',
    uri: `${options.baseUrl}/auth`,
    body: userCredentials,
    json: true,
  };

  return request(registerRequestOptions).catch((response) => {
    if (response.statusCode === 404) {
      console.error('User not found. Please try again.');
      return Promise.reject();
    }
    return Promise.reject(response);
  });

};

// Create a minimal archive of the project conforming to .gitignore by using the
// git archive -o method. Assumes working directory is a valid Git repo..?
const prepareProject = () => {

  return new Promise((resolve, reject) => {

    cp.exec('git archive -o ._electrode_project.zip master', {}, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });

  });

};

// Pipe the new project.zip to the remote server, passing our options from the command line
// and the project.json file
const uploadProject = () => {

  const registerRequestOptions = {
    method: 'POST',
    uri: `${options.baseUrl}/app-package`,
    headers: {
      Authorization: apiKey
    },
    formData: {
      package: fs.createReadStream(path.join(process.cwd(), '._electrode_project.zip')),
      options: JSON.stringify(options),
      packageJSON: JSON.stringify(packageJSON)
    },
    json: true,
  };

  return request(registerRequestOptions);

};

// Perform all of the above steps in order
const buildTask = () => {

  return validateWorkingDirectory()
    .then(() => {
      return getCredentials();
    })
    .then((creds) => {
      spinner.start();
      spinner.text = 'Registering you...';
      return verifyCredentials(creds);
    })
    .then(() => {
      return doRegister();
    })
    .then(() => {
      spinner.text = 'Authorizing you...';
      return doAuth();
    })
    .then((authResult) => {
      spinner.text = 'Preparing your project...';
      apiKey = authResult.apiKey;
      return prepareProject();
    })
    .then(() => {
      spinner.text = 'Uploading your project...';
      return uploadProject();
    });

};

console.log(`⚛️  Electrode CLI ${pkg.version} ~ https://electrode.cleverthings.io`.bold);

// What are we doing?
switch (task) {
  case 'build':

    buildTask()
      .then(() => {
        spinner.stop();
        console.log('Success!'.bold.green, 'Your job has been queued and will be built shortly. You will recieve an email when it is finished. Remember, builds are only available for 24 hours after completion, so make sure you check your email! Have a great day!');
        process.exit(0);
      })
      .catch((e) => {
        console.error('!! Error: '.bold.red, e);
        process.exit(1);
      });

    break;
  default:
    console.error('😕  Unrecognised task. Please refer to the README');
    process.exit(1);
    break;
}
