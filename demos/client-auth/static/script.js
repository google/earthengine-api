var CLIENT_ID = '<your-oauth-client-id>';

// Runs a simple EE analysis and output the results to the web page.
var runAnalysis = function() {
  ee.initialize();
  var imageMetadata = ee.Image(1).getInfo();
  $('.output').text(JSON.stringify(imageMetadata), null, ' ');
};

$(document).ready(function() {
  // Shows a button prompting the user to log in.
  var onImmediateFailed = function() {
    $('.g-sign-in').removeClass('hidden');
    $('.output').text('(Log in to see the result.)');
    $('.g-sign-in .button').click(function() {
      ee.data.authenticateViaPopup(function() {
        // If the login succeeds, hide the login button and run the analysis.
        $('.g-sign-in').addClass('hidden');
        runAnalysis();
      });
    });
  };

  // Attempt to authenticate using existing credentials.
  ee.data.authenticate(CLIENT_ID, runAnalysis, null, null, onImmediateFailed);
});
