global.ee = require('../build/main');
const token = process.env['EE_ACCESS_TOKEN'];
if (token) {
  ee.apiclient.setAuthToken('', 'Bearer', token, 3600, [], undefined, false);
  ee.apiclient.setCloudApiEnabled(true);
  console.log('Testing Cloud API');
} else {
  ee.apiclient.setCloudApiEnabled(false);
  console.log('Testing Legacy API');
}

