const grunt = require('grunt');


/**
 * Grunt configuration. Defines a task (`npm run build`) for creating both
 * browser and Node.js CommonJS modules that can be published to NPM.
 */

grunt.loadNpmTasks('grunt-contrib-concat');


// clang-format off

/**
 * Browser build.
 * - CommonJS exports.
 */
const BROWSER_BANNER = '';
const BROWSER_FOOTER = [
  'goog.global = window;',
  'goog.Timer.defaultTimerObject = window;',
  'module.exports = ee;'
].join('\n') + '\n';

/**
 * Node.js build.
 * - CommonJS exports. See b/77731705.
 * - 'googleapis' dependency, used for serverside authentication.
 * - XmlHttpRequest polyfill, for network requests.
 */
const NODEJS_BANNER = [
  'const {google} = require(\'googleapis\');',
  'const XMLHttpRequest = require(\'xmlhttprequest\').XMLHttpRequest;',
].join('\n') + '\n';
const NODEJS_FOOTER = [
  'goog.Timer.defaultTimerObject = global;',
  'module.exports = goog.global.ee = ee;'
].join('\n') + '\n';

// clang-format on


const BUILD_DIR = 'build';


/** Build configuration. */
grunt.initConfig({
  /**
   * Using the compilation output, creates CommonJS targets for Node.js and
   * browser build tooling. The browser target is used by build bundlers like
   * Browserify, Webpack, and native ES6 modules.
   *
   * For traditional HTML script
   * <scripts src="..."/> includes, use build/ee_api_js*.js instead.
   */
  concat: {
    browser: {
      src: [`${BUILD_DIR}/ee_api_js_npm.js`],
      dest: `${BUILD_DIR}/browser.js`,
      options: {banner: BROWSER_BANNER, footer: BROWSER_FOOTER}
    },
    nodejs: {
      src: [`${BUILD_DIR}/ee_api_js_npm.js`],
      dest: `${BUILD_DIR}/main.js`,
      options: {banner: NODEJS_BANNER, footer: NODEJS_FOOTER}
    }
  }
});

/**
 * Default tasks, executed consecutively with `grunt` command.
 */
grunt.registerTask('default', ['concat:nodejs', 'concat:browser']);
