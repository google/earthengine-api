global.ee = require('../build/main');
const token = process.env['EE_ACCESS_TOKEN'];
if (token) {
  ee.apiclient.setAuthToken('', 'Bearer', token, 3600, [], undefined, false);
} else {
  throw new Error(
      'Must supply a user access token in the environment ' +
      'variable, EE_ACCESS_TOKEN, to run tests. ' +
      'For example, run the following before running the test:\n' +
      'export EE_ACCESS_TOKEN="' +
      '$(gcloud auth application-default print-access-token)"');
}

