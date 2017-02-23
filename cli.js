const path = require('path');
const fs = require('fs');
const cp = require('child_process');

const request = require('request-promise');
const requestErrors = require('request-promise/errors');
const inquirer = require('inquirer');
const ora = require('ora');

const pkg = require('./package.json');

const args = process.argv.slice(2);
const task = args[0];

const options = {
  baseUrl: 'https://electrode.cleverthings.io',
  platforms: ['mac'],
  arch: 'x64'
};

const spinner = ora('Electrode CLI');

//
let userCredentials = {};
let packageJSON = {};
let apiKey = null;

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

    return inquirer.prompt(credsQuestions, (answers) => {
      return resolve(answers);
    });

  });

};

const verifyCredentials = (creds) => {

  if (!creds.email || !creds.password) {
    console.error('✋  You need to enter a username and password!');
    process.exit(1);
  }

  userCredentials = creds;
  return Promise.resolve();

};

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
    } else {
      return Promise.reject(response);
    }
  });

};

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

const prepareProject = () => {

  return new Promise((resolve, reject) => {

    cp.exec('git archive -o ._electrode_project.zip master', {}, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });

  });

};

const uploadProject = () => {

  const registerRequestOptions = {
    method: 'POST',
    uri: `${options.baseUrl}/app-package`,
    headers: {
      Authorization: apiKey
    },
    formData: {
      package: fs.createReadStream(path.join(process.cwd(), '._electrode_project.zip')),
    },
    json: true,
  };

  return request(registerRequestOptions);

};

const buildTask = () => {

  return validateWorkingDirectory()
    .then(() => {
      return getCredentials();
    }).then((creds) => {
      spinner.start();
      spinner.text = 'Registering you...';
      return verifyCredentials(creds);
    }).then(() => {
      return doRegister();
    }).then((registerResult) => {
      spinner.text = 'Authorizing you...';
      return doAuth();
    }).then((authResult) => {
      spinner.text = 'Preparing your project...';
      apiKey = authResult.apiKey;
      return prepareProject();
    }).then(() => {
      spinner.text = 'Uploading your project...';
      return uploadProject();
    }).then((jobInfo) => {
      spinner.stop();
      console.log('Success!');
      console.log('Your job has been queued and will be built shortly. You will recieve an email when it is finished. Remember, builds are only available for 24 hours after completion, so make sure you check your email! Have a great day!');
      process.exit(0);
    }).catch((e) => {
      console.error(e);
    });

};

console.log(`⚛️  Electrode CLI ${pkg.version}`);
console.log('Working with', process.cwd());

switch (task) {
  case 'build':
    buildTask().catch((e) => {
      process.exit(1);
    }).then(() => {
      //console.log('done');
    })
    break;
  default:
    console.error('Unrecognised task. Please refer to the README');
    process.exit(1);
    break;
}
