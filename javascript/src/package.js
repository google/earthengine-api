/**
 * Packages are a set of saved algorithms.
 *
 * The contents of a package are stored as individual assets in a folder.
 * A package is intialized by synchronously retrieving the folder's contents.
 * The folder will contain 1 signature for each saved algorithm.  A
 * SavedFunction object is created for each saved algoirhtm and is wrapped
 * with a real JavaScript function to make it callable.  SavedFunction
 * is just a proxy for a call to LoadAlgorithmById().
 *
 * Adding an algorithm to a package requires specifying signature information
 * identifying types for the arguments and return value.  It's also recommended
 * that the algorithm and arguments be documented using 'description' and
 * 'docs' fields when building the signature.
 *
 * When the package is being saved, each of the user's functions is replaced
 * with a SavedFunction object, and only then are the user's original functions
 * evaluated, to allow the user's functions to call each other.
 *
 * Packages are cached so they don't have to be retrieved from the server
 * multiple times.
 *
 * WARNING: In the current playground implementation, ee.Package is injected
 * into the user's VM as JavaScript to get around limitations in Caja related
 * to a bunch of functions being generated at runtime.  This means:
 * 1) no closure functions are available.  The lines in this file beginning
 *    with "^goog" are automatically stripped.
 * 2) The package cache is only retained for the duration of 1 script execution.
 *
 */
goog.provide('ee.Package');

goog.require('ee.ApiFunction');
goog.require('ee.CustomFunction');
goog.require('ee.SavedFunction');
goog.require('ee.arguments');
goog.require('ee.data');



/**
 * Create a package.
 *
 * If opt_path is specified, and this package isn't cached, it is
 * synchronously loaded from the asset store.  If no path is specified,
 * a new, empty package is created.
 *
 * @param {string=} opt_path The asset ID of an existing package.
 *
 * @constructor
 * TODO(user): Add an at-export annotations once packages are ready.
 */
ee.Package = function(opt_path) {
  // If this package has already been loaded, return it.
  if (opt_path && ee.Package.importedPackages_[opt_path]) {
    return ee.Package.importedPackages_[opt_path];
  }

  // Constructor safety.
  if (!(this instanceof ee.Package)) {
    return new ee.Package(opt_path);
  }

  if (opt_path) {
    // Initialize this package with the contents from the asset store.
    //
    // We currently have to block on initialization because there's nothing to
    // intercept if a user tries to use a member of this package immediately.
    //
    // TODO(user): Handle loading constants in the folder.
    var contents = ee.Package.getFolder(opt_path);
    for (var i = 0; i < contents.length; i++) {
      var parts = contents[i]['id'].split('/');
      var name = parts[parts.length - 1];
      var signature = /** @type {ee.Function.Signature} */ (contents[i]);
      this[name] = ee.Package.makeInvocation_(opt_path, name, signature);
    }

    // Add this to the list of packages so all calls get the same instance.
    ee.Package.importedPackages_[opt_path] = this;
  }
};


/**
 * A cache of the packages that have already been loaded.
 * @type {Object.<ee.Package>}
 * @private
 */
ee.Package.importedPackages_ = {};


/**
 * Add a user's function to a package.  The function will not be callable
 * until the package has been saved.
 *
 * @param {string|ee.Function.Signature} signature The function's signature,
 *     or a C-style function declaration string, to construct a signature from.
 * @param {Function} body The function's body.
 * @return {Function} The newly added function.
 */
ee.Package.makeFunction = function(signature, body) {
  if (typeof(signature) == 'string') {
    signature = ee.Package.decodeDecl(/** @type {string} */ (signature));
  }

  // We can't run the function yet as it may use other functions in the package.
  var func = function() { throw Error('Package not saved.'); };
  func['body'] = body;
  func['signature'] = signature;

  return func;
};


/**
 * Save a package.
 *
 * Serialize the contents of a package to the asset store.  This is a bit
 * tricky, because we need functions in a package to be able to refer to
 * each other.  To enable this, we do the following:
 *
 * 1) Swap out all the user's functions with SavedFunctions (so there's
 *    something in the package for each of the user's function to call.)
 * 2) Convert the original functions to CustomFunctions, (which evaluates
 *    them with placeholder variables).
 * 3) Serialize the CustomFunctions into the asset store.
 *
 * @param {ee.Package} pkg The package to save.
 * @param {string} path The path to save the package under.
 */
ee.Package.save = function(pkg, path) {
  var args = ee.arguments.extractFromFunction(ee.Package.save, arguments);
  pkg = args['pkg'];
  path = args['path'];

  if (!path) {
    throw Error('No path specified.');
  }

  // Replace all the user's functions with SavedFunctions before we run them.
  // This allows one function in the package to reference another.
  var original = {};
  for (var name in pkg) {
    if (pkg.hasOwnProperty(name)) {
      var member = pkg[name];
      if (member instanceof Function) {
        if (member['isSaved']) {
          var expected = path + '/' + name;
          // Skip functions that have already been converted in the
          // case of adding functions to an existing package.
          if (member['path'] != expected) {
            // Something funny has happened.  Someone might have copied
            // a savedfunction from another package.  Throw an error.
            throw Error('Function name mismatch.  Expected path: ' +
                expected + ' but found: ' + member['path']);
          }
        } else {
          if ('signature' in member) {
            // Save the existing function and replace it with a SavedFunction.
            original[name] = member;
            pkg[name] =
                ee.Package.makeInvocation_(path, name, member['signature']);
          } else {
            throw Error('No signature for function: ' + name);
          }
        }
      } else {
        // TODO(user): Handle saving constants in the package.
        throw Error('Can\'t save constants: ' + name);
      }
    }
  }

  // Create a CustomFunction for each converted function.  This will run
  // the user's function.
  var custom = [];
  for (var name in original) {
    var body = original[name]['body'];
    var signature = original[name]['signature'];
    var func = new ee.CustomFunction(signature, body);
    var properties = {'text': body.toString()};
    custom.push({
      'name': name,
      'algorithm': ee.ApiFunction._call(
          'SavedAlgorithm', func, signature, properties)
    });
  }

  if (custom.length) {
    // Make sure the destination folder exists.
    // Catching the text in the error message is a little brittle.
    // TODO(user): The server should probably throw error codes instead.
    try {
      ee.data.createFolder(path);
    } catch (e) {
      if (!e.message.match(/exists/)) {
        // Rethrow the error if it's not an existence error.
        throw (e);
      }
    }

    // Save everything that needs saving.
    for (var index = 0; index < custom.length; index++) {
      var name = custom[index]['name'];
      var algorithm = custom[index]['algorithm'].serialize();
      ee.data.createAsset(algorithm, path + '/' + name);
    }
  }
};


/**
 * Return the contents of an Earth Engine folder.
 *
 * @param {string} path The folder's path.
 * @return {Array.<Object>} A list of the folder's contents.
 */
ee.Package.getFolder = function(path) {
  return /** @type {Array.<Object>} */(
      ee.ApiFunction.lookup('LoadFolder').call(path).getInfo());
};


/**
 * A helper function that attempts to decode a C-style function declaration
 * string into a signature object.  This doesn't do robust checking.
 *
 * @param {string} decl A string containing the function's declaration.
 * @return {ee.Function.Signature} The newly constructed signature or null.
 */
ee.Package.decodeDecl = function(decl) {
  // This is implemented as a simple parser with peek() and expect().
  var parts = decl.match(/\w+|\S/g);    // The tokenized input.
  var cur = 0;                          // Tracks the current token.

  // Return the next token.
  var peek = function() {
    return parts[cur];
  };

  // Expect the input specified by regex.  Returns the matching text.
  var expect = function(regex) {
    var match = peek() && peek().match(regex);
    if (match) {
      cur++;
      return match[0];
    }
    throw Error('Unable to decode declaration.');
  };

  // Match a function declaration of the form: TYPE NAME '(' ARGS ') ;?
  var type = expect(/\w+/);           // The function type
  expect(/\w+/);                      // The function name
  expect(/\(/);
  var collected = [];
  // Match arguments of the form: {TYPE NAME {, TYPE NAME}}
  while (peek() && !peek().match('\\)')) {
    if (collected.length) {
      expect(',');
    }
    collected.push({
      'type': expect(/\w+/),
      'name': expect(/\w+/)
    });
  }
  expect(/\)/);
  if (peek() == ';') {
    expect(';');      // Skip an optional trailing ';'
  }

  // If there is anything left, it is an error.
  if (peek()) {
    throw Error('Unable to decode declaration.  Found extra trailing input.');
  }

  return /** @type {ee.Function.Signature} */({
    'returns': type,
    'args': collected
  });
};


/**
 * Encode a signature into a C-style string declaration.  This is used
 * in functions descriptions.
 *
 * @param {ee.Function.Signature} signature The function's signature.
 * @param {string} name The function's name.
 * @return {string} The string representation of this function's declaration.
 *
 * @private
 */
ee.Package.encodeDecl_ = function(signature, name) {
  var out = [
    signature['returns'],
    ' ',
    name,
    '('
  ];
  if (signature.args) {
    for (var i = 0; i < signature.args.length; i++) {
      if (i > 0) {
        out.push(', ');
      }
      out.push(signature.args[i].type + ' ' + signature.args[i].name);
    }
  }
  out.push(')');
  return out.join('');
};


/**
 * Initialize a callable SavedFunction for the given signature.
 * @param {string} path The path to the saved function's folder.
 * @param {string} name The name of the saved function.
 * @param {ee.Function.Signature} signature The function's signature,
 * @return {Function} A function making the SavedFunction callable.
 * @private
 */
ee.Package.makeInvocation_ = function(path, name, signature) {
  var savedFunction = new ee.SavedFunction(path + '/' + name, signature);

  // A function wrapper so the savedFunction is callable.
  var fn = function(var_args) {
    var args = Array.prototype.slice.call(arguments);
    return savedFunction.call.apply(savedFunction, args);
  };

  // Decorate the wrapper function with the signature and docs.
  fn.toString = function() {
    return signature['returns'] + ' ' + savedFunction.toString(name);
  };
  fn['isSaved'] = true;
  return fn;
};
