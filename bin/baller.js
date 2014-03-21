#!/usr/bin/env node

var _ = require('underscore');
var fs = require('fs');
var handlebars = require('handlebars');
var path = require('path');
var program = require('commander');

var pkg = require('../package.json');


program
  .version(pkg.version);

program
  .command('create <name>')
  .description('Create a new, empty ball in a new directory')
  .action(function (name) {
    var errorMessage = 'Could not create ball';

    // Create a new directory (fail and exist if dir exists or other failure)
    try {
      fs.mkdirSync(name);
    } catch (e) {
      if (e.errno === 47) {
        errorMessage += ': Directory "' + name + '" already exists';
      }
      console.error(errorMessage);
      process.exit(1);
    }

    // Copy `files` file over to directory, prepending list of existing files
    try {
      var filesName = 'files';
      var originalPath = getResourcePath(filesName);
      var copyPath = path.join(name, filesName);
      var content = fs.readFileSync(originalPath);
      fs.writeFileSync(copyPath, content);
    } catch (e) {
      errorMessage += ': `files` creation failed';
      console.error(errorMessage);
      process.exit(1);
    }

    // Add baller metadata
    try {
      fs.mkdirSync(path.join(name, '.baller'));
      fs.writeFileSync(path.join(name, '.baller', 'version'), pkg.version);
    } catch (e) {
      errorMessage += ': metadata creation failed';
      console.error(errorMessage);
      process.exit(1);
    }

    // Write rendered template to directory (as README.md)
    try {
      var readmePath = path.join(name, 'README.md');
      var readme = renderReadme(name);
      fs.writeFileSync(readmePath, readme);
    } catch (e) {
      errorMessage += ': README creation failed';
      console.error(errorMessage);
      process.exit(1);
    }

    // Copy scripts to directory
    try {
      var scripts = fs.readdirSync(getScriptPath());
      _.each(scripts, function (script) {
        var originalPath = getScriptPath(script);
        var copyPath = path.join(name, script);
        var content = fs.readFileSync(originalPath);
        fs.writeFileSync(copyPath, content);
        fs.chmodSync(copyPath, 0755);
      });
    } catch (e) {
      errorMessage += ': scripts creation failed';
      console.error(errorMessage);
      process.exit(1);
    }

    console.log('Created "' + name + '" ball');
  });

program
  .command('init')
  .description('Initialize current directory and files as a ball')
  .action(function () {
    var errorMessage = 'Could not initialize ball';
    var name = path.basename(process.cwd());

    // Copy `files` file over to directory, prepending list of existing files
    try {
      var files = fs.readdirSync('.');
      var filesName = 'files';
      var originalPath = getResourcePath(filesName);
      var copyPath = filesName;
      var content = _.map(files, function (file) {
        return file + '\n';
      }).join('');
      content += fs.readFileSync(originalPath);
      fs.writeFileSync(copyPath, content);
    } catch (e) {
      errorMessage += ': `files` creation failed';
      console.error(errorMessage);
      process.exit(1);
    }

    // Abort init if already a ball, otherwise add baller metadata
    try {
      var isBall = fs.existsSync('.baller');
      if (isBall) {
        errorMessage += ': directory is already a ball';
        console.error(errorMessage);
        process.exit(1);
      } else {
        fs.mkdirSync('.baller');
        fs.writeFileSync(path.join('.baller', 'version'), pkg.version);
      }
    } catch (e) {
      errorMessage += ': metadata creation failed';
      console.error(errorMessage);
      process.exit(1);
    }

    // Write rendered template to directory (as README.md)
    try {
      var readmePath = 'README.md';
      var readme = renderReadme(name);
      fs.writeFileSync(readmePath, readme);
    } catch (e) {
      errorMessage += ': README creation failed';
      console.error(errorMessage);
      process.exit(1);
    }

    // Copy scripts to directory
    try {
      var scripts = fs.readdirSync(getScriptPath());
      _.each(scripts, function (script) {
        var originalPath = getScriptPath(script);
        var copyPath = script;
        var content = fs.readFileSync(originalPath);
        fs.writeFileSync(copyPath, content);
        fs.chmodSync(copyPath, 0755);
      });
    } catch (e) {
      errorMessage += ': scripts creation failed';
      console.error(errorMessage);
      process.exit(1);
    }

    console.log('Initialized "' + name + '" ball');
  });

program
  .command('update')
  .description('Update the current ball to latest Baller scripts')
  .action(function () {
    console.log('updating');
  });

program
  .command('unball')
  .description('Remove all Baller scripts from current ball')
  .action(function () {
    console.log('unballing');
  });

program
  .command('deploy')
  .description('Deploy the current ball to GitHub (or update existing deploy)')
  .action(function () {
    console.log('deploying');
  });

program
  .command('*')
  .description('Show help')
  .action(program.outputHelp);


program.parse(process.argv);


if (!program.args.length) {
  program.help();
}


// Return absolute path for module-owned file
function getModulePath(name, dir) {
  var path = __dirname + '/../' + dir;
  if (name) {
    path += '/' + name;
  }
  return path;
}

// Return path for template
function getTemplatePath(template) {
  return getModulePath(template, 'templates');
}

// Return path for resource
function getResourcePath(resource) {
  return getModulePath(resource, 'resources');
}

// Return path for script
function getScriptPath(script) {
  return getModulePath(script, 'scripts');
}


// Render template resource with given context and return result
function renderTemplate(template, context) {
  var source = fs.readFileSync(getTemplatePath(template)).toString();
  var compiledTemplate = handlebars.compile(source);
  return compiledTemplate(context);
}

// Render README for current user with given ball name and return result
function renderReadme(name) {
  var context = {
    name: name,
    username: process.env.USER
  };
  return renderTemplate('README.md.hbs', context);
}
