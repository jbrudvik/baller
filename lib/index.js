var _ = require('underscore');
var fs = require('fs');
var handlebars = require('handlebars');
var path = require('path');
var rimraf = require('rimraf');

var pkg = require('../package.json');


// Baller meta directory
var BALLER_META_DIR = '.baller';

// Files introduced by Baller
var BALLER_FILES = [
  BALLER_META_DIR
].concat(
  fs.readdirSync(getScriptPath()),
  _.map(fs.readdirSync(getTemplatePath()), function (template) {
    return template.slice(0, template.lastIndexOf('.'));
  })
);

// Subdirectory used by Baller to store files
var FILES_DIR = 'files';

// Files never managed by a ball
var IGNORED_FILES = BALLER_FILES.concat([
  '.git',
  'LICENSE',
  FILES_DIR
]);


/*
 * Create a new, empty ball in a new directory.
 *
 * Returns a success message if successful. Throws an error if unsuccessful.
 */
function create(name) {
  var errorMessage = 'Could not create ball';

  if (!name) {
    throw new Error(errorMessage + ': no name given');
  }

  // Create a new directory (fail and exist if dir exists or other failure)
  try {
    fs.mkdirSync(name);
  } catch (e) {
    if (e.errno === 47) {
      errorMessage += ': Directory "' + name + '" already exists';
    }
    throw new Error(errorMessage);
  }

  createFilesDir({
    dir: name,
    errorMessage: errorMessage
  });

  createBallerMetadata({
    dir: name,
    errorMessage: errorMessage
  });

  writeRenderedReadme({
    name: name,
    dir: name,
    errorMessage: errorMessage
  });

  copyScriptsToDirectory({
    dir: name,
    errorMessage: errorMessage
  });

  return 'Created "' + name + '" ball';
}

/*
 * Initialize current directory and files as a ball.
 *
 * Returns a success message if successful. Throws an error if unsuccessful.
 */
function init() {
  var errorMessage = 'Could not initialize ball';
  var name = path.basename(process.cwd());

  createFilesDir({
    errorMessage: errorMessage
  });

  createBallerMetadata({
    errorMessage: errorMessage
  });

  writeRenderedReadme({
    name: name,
    errorMessage: errorMessage
  });

  copyScriptsToDirectory({
    errorMessage: errorMessage
  });

  return 'Initialized "' + name + '" ball';
}

/*
 * Update the current ball to latest Baller scripts.
 *
 * Returns a success message if successful. Throws an error if unsuccessful.
 */
function update() {
  throw new Error('update not yet implemented');
}

/*
 * Remove all Baller scripts from current ball and move files in Baller
 * subdirectory to current directory.
 *
 * Returns a success message if successful. Throws an error if unsuccessful.
 */
function destroy() {
  var errorMessage = 'Could not destroy ball';
  var name = path.basename(process.cwd());

  var isBall = fs.existsSync(BALLER_META_DIR);
  if (!isBall) {
    throw new Error(errorMessage + ': directory "' + name + '" is not a ball');
  }

  try {

    // Remove all Baller files
    _.each(BALLER_FILES, function (file) {
      rimraf.sync(file);
    });

    // Move all contents out of `files` subdirectory
    var prefix = generateUnlikelyString();
    var prefixedFile = prefix + FILES_DIR;
    var files = fs.readdirSync(FILES_DIR);
    _.each(files, function (file) {
      var original = path.join(FILES_DIR, file);
      var rename = (file === FILES_DIR) ? prefixedFile : file;
      fs.renameSync(original, rename);
    });

    // Remove the `files` subdirectory
    fs.rmdirSync(FILES_DIR);

    // Rename file that should have had same name as `files` subdirectory
    if (fs.existsSync(prefixedFile)) {
      fs.renameSync(prefixedFile, FILES_DIR);
    }

    return 'Destroyed "' + name + '" ball';
  } catch (e) {
    throw new Error(errorMessage);
  }
}

/*
 * Deploy the current ball to GitHub (or update existing deploy).
 *
 * Returns a success message if successful. Throws an error if unsuccessful.
 */
function deploy() {
  throw new Error('deploy not yet implemented');
}


/*
 * Return absolute path for module-owned file
 */
function getModulePath(name, dir) {
  var path = __dirname + '/../' + dir;
  if (name) {
    path += '/' + name;
  }
  return path;
}

/*
 * Return path for template
 */
function getTemplatePath(template) {
  return getModulePath(template, 'templates');
}

/*
 * Return path for script
 */
function getScriptPath(script) {
  return getModulePath(script, 'scripts');
}

/*
 * Render template resource with given context and return result
 */
function renderTemplate(template, context) {
  var source = fs.readFileSync(getTemplatePath(template)).toString();
  var compiledTemplate = handlebars.compile(source);
  return compiledTemplate(context);
}

/*
 * Render README for current user with given ball name and return result
 */
function renderReadme(name) {
  var context = {
    name: name,
    username: process.env.USER
  };
  return renderTemplate('README.md.hbs', context);
}


/*
 * Create `files` subdirectory and move any existing files and directories into
 * it (excluding Baller files)
 *
 * Options:
 * - dir: Directory in which `files` subdirectory will be created (default: '.')
 * - errorMessage: Base error message (default: 'Error')
 */
function createFilesDir(options) {
  options.dir = options.dir || '.';
  options.errorMessage = options.errorMessage || 'Error';

  try {
    var files = _.difference(fs.readdirSync(options.dir), IGNORED_FILES);

    // Create `files` subdirectory
    var filesDirName = FILES_DIR;
    var filesDir = path.join(options.dir, filesDirName);
    if (fs.existsSync(filesDir)) {
      // Move existing `files` file (or directory) in to `files` subdirectory
      var filesFile = filesDir;
      var prefix = generateUnlikelyString();
      var prefixedFilesFile = prefix + filesFile;
      fs.renameSync(filesFile, prefixedFilesFile);
      fs.mkdirSync(filesDir);
      fs.renameSync(prefixedFilesFile, path.join(filesDir, filesFile));
    } else {
      fs.mkdirSync(filesDir);
    }

    // Move files into `files` subdirectory
    _.each(files, function (file) {
      fs.renameSync(file, path.join(filesDir, file));
    });
  } catch (e) {
    throw new Error(options.errorMessage + ': "files" subdirectory creation failed');
  }
}

/*
 * Add Baller metadata to directory. This turns a directory into a "ball".
 *
 * If directory already contains Baller metadata, creation will be aborted.
 *
 * Options:
 * - dir: Directory in which metadata will be create (default: '.')
 * - errorMessage: Base error message (default: 'Error')
 */
function createBallerMetadata(options) {
  options.dir = options.dir || '.';
  options.errorMessage = options.errorMessage || 'Error';

  var ballerMetaPath = path.join(options.dir, BALLER_META_DIR);
  var isBall = fs.existsSync(ballerMetaPath);

  if (isBall) {
    throw new Error(options.errorMessage + ': directory is already a ball');
  }

  try {
    fs.mkdirSync(ballerMetaPath);
    fs.writeFileSync(path.join(ballerMetaPath, 'version'), pkg.version);
  } catch (e) {
    throw new Error(options.errorMessage + ': metadata creation failed');
  }
}

/*
 * Write rendered README.md to directory
 *
 * Options:
 * - name: Ball name that will be used in README.md (required)
 * - dir: Directory to which files will be copied (default: '.')
 * - errorMessage: Base error message (default: 'Error')
 */
function writeRenderedReadme(options) {
  options.dir = options.dir || '.';
  options.errorMessage = options.errorMessage || 'Error';

  try {
    var readmePath = path.join(options.dir, 'README.md');
    var readme = renderReadme(options.name);
    fs.writeFileSync(readmePath, readme);
  } catch (e) {
    throw new Error(options.errorMessage + ': README creation failed');
  }
}

/*
 * Copy scripts to directory
 *
 * Options:
 * - dir: Directory to which files will be copied (default: '.')
 * - errorMessage: Base error message (default: 'Error')
 */
function copyScriptsToDirectory(options) {
  options.dir = options.dir || '.';
  options.errorMessage = options.errorMessage || 'Error';

  try {
    copyDirSyncWithMode(getScriptPath(), options.dir);
  } catch (e) {
    throw new Error(options.errorMessage + ': scripts creation failed');
  }
}


/*
 * Recursively copy contents of one directory to another. Copies file modes
 * (including permissions) as well. Synchronous.
 *
 * Assumptions:
 * - src and dest directories both exist
 * - dest directory is empty (or may have files overwritten)
 *
 * Parameters:
 * - src: Source directory (required)
 * - dest: Destination directory (required)
 */
function copyDirSyncWithMode(src, dest) {
  var files = fs.readdirSync(src);
  _.each(files, function (file) {
    var srcFile = path.join(src, file);
    var destFile = path.join(dest, file);
    var mode = fs.statSync(srcFile).mode;
    if (fs.statSync(srcFile).isDirectory()) {
      fs.mkdirSync(destFile);
      copyDirSyncWithMode(srcFile, destFile);
    } else {
      var content = fs.readFileSync(srcFile);
      fs.writeFileSync(destFile, content);
    }
    fs.chmodSync(destFile, mode);
  });
}

/*
 * Return unlikely string
 */
function generateUnlikelyString() {
  return 'qCc2c6mgWYLjCF4jwcsvzPUD-' + (new Date()).getTime() + '-';
}


module.exports = {
  create: create,
  init: init,
  update: update,
  destroy: destroy,
  deploy: deploy
};
