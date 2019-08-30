window.ee = require('../build/browser');
const [token] = __karma__.config.args;
if (token) {
  ee.apiclient.setAuthToken('', 'Bearer', token, 3600, [], undefined, false);
  ee.apiclient.setCloudApiEnabled(true);
  console.log('Testing Cloud API');
} else {
  ee.apiclient.setCloudApiEnabled(false);
  console.log('Testing Legacy API');
}
