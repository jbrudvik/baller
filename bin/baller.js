#!/usr/bin/env node

var _ = require('underscore');
var fs = require('fs');
var handlebars = require('handlebars');
var path = require('path');
var program = require('commander');

var pkg = require('../package.json');


var BALLER_META_DIR = '.baller';


program
  .version(pkg.version);

program
  .command('create <name>')
  .description('Create a new, empty ball in a new directory')
  .action(create);

program
  .command('init')
  .description('Initialize current directory and files as a ball')
  .action(init);

program
  .command('update')
  .description('Update the current ball to latest Baller scripts')
  .action(function () {
    console.log('update not yet implemented');
  });

program
  .command('unball')
  .description('Remove all Baller scripts from current ball')
  .action(function () {
    console.log('unball not yet implemented');
  });

program
  .command('deploy')
  .description('Deploy the current ball to GitHub (or update existing deploy)')
  .action(function () {
    console.log('deploy not yet implemented');
  });

program
  .command('*')
  .description('Show help')
  .action(program.outputHelp);


program.parse(process.argv);


if (!program.args.length) {
  program.help();
}


/*
 * create action
 */
function create(name) {
  var errorMessage = 'Could not create ball';

  // Create a new directory (fail and exist if dir exists or other failure)
  try {
    fs.mkdirSync(name);
  } catch (e) {
    if (e.errno === 47) {
      errorMessage += ': Directory "' + name + '" already exists';
    }
    outputErrorAndExit(options.errorMessage);
  }

  createFilesFile({
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

  console.log('Created "' + name + '" ball');
}

/*
 * init action
 */
function init() {
  var errorMessage = 'Could not initialize ball';
  var name = path.basename(process.cwd());

  createFilesFile({
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

  console.log('Initialized "' + name + '" ball');
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
 * Return path for resource
 */
function getResourcePath(resource) {
  return getModulePath(resource, 'resources');
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
 * Return boolean indicating if the file should be ignored by Baller actions
 */
function ignoredFile(file) {
  var filesToIgnore = [
    BALLER_META_DIR,
    '.git',
    'LICENSE'
  ].concat(
    fs.readdirSync(getScriptPath()),
    fs.readdirSync(getResourcePath()),
    _.map(fs.readdirSync(getTemplatePath()), function (template) {
      return template.slice(0, template.lastIndexOf('.'));
    })
  );

  return _.contains(filesToIgnore, file);
}

/*
 * Output error message and exit process
 */
function outputErrorAndExit(errorMessage) {
  console.error(errorMessage);
  process.exit(1);
}

/*
 * Create `files` file in directory, prepending list of existing files
 * in that directory (excluding Baller files)
 *
 * Options:
 * - dir: Directory in which `files` will be created (default: '.')
 * - errorMessage: Base error message (default: 'Error')
 */
function createFilesFile(options) {
  options.dir = options.dir || '.';
  options.errorMessage = options.errorMessage || 'Error';

  try {
    var files = _.reject(fs.readdirSync(options.dir), function (file) {
      return ignoredFile(file);
    });
    var filesName = 'files';
    var originalPath = getResourcePath(filesName);
    var copyPath = path.join(options.dir, filesName);
    var content = _.map(files, function (file) {
      return file + '\n';
    }).join('');
    content += fs.readFileSync(originalPath);
    fs.writeFileSync(copyPath, content);
  } catch (e) {
    outputErrorAndExit(options.errorMessage + ': `files` creation failed');
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

  try {
    var ballerMetaPath = path.join(options.dir, BALLER_META_DIR);
    var isBall = fs.existsSync(ballerMetaPath);
    if (isBall) {
      outputErrorAndExit(options.errorMessage + ': directory is already a ball');
    } else {
      fs.mkdirSync(ballerMetaPath);
      fs.writeFileSync(path.join(ballerMetaPath, 'version'), pkg.version);
    }
  } catch (e) {
    outputErrorAndExit(options.errorMessage + ': metadata creation failed');
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
    outputErrorAndExit(options.errorMessage + ': README creation failed');
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
    var scripts = fs.readdirSync(getScriptPath());
    _.each(scripts, function (script) {
      var originalPath = getScriptPath(script);
      var copyPath = path.join(options.dir, script);
      var content = fs.readFileSync(originalPath);
      fs.writeFileSync(copyPath, content);
      fs.chmodSync(copyPath, 0755);
    });
  } catch (e) {
    outputErrorAndExit(options.errorMessage + ': scripts creation failed');
  }
}
