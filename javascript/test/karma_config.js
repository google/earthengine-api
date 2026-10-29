/** @param {!Object} config */
module.exports = function(config) {
  config.set({
    browsers: ['ChromeHeadless'],
    frameworks: ['jasmine', 'browserify'],
    plugins: ['karma-jasmine', 'karma-chrome-launcher', 'karma-browserify'],
    files: ['init_browser.js', '*_test.js'],
    preprocessors: {'*.js': ['browserify']},
    client: {
      args: [process.env['EE_ACCESS_TOKEN']],
    },
  });
};
