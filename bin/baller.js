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
    console.log('creating: ' + name + '\n');

    var context = {
      name: name
    };

    console.log(renderTemplate('README.md.hbs', context));
  });

program
  .command('init')
  .description('Initialize current directory and files as a ball')
  .action(function () {
    console.log('initing' + '\n');

    var context = {
      name: path.basename(process.cwd())
    };

    console.log(renderTemplate('README.md.hbs', context));
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


// Render module template resource with given context and return result
function renderTemplate(resource, context) {
  var source = fs.readFileSync(getResourcePath(resource)).toString();
  var template = handlebars.compile(source);

  var defaultContext = {
    username: process.env.USER
  };

  context = _.extend(defaultContext, context);

  return template(defaultContext);
}

// Return module resource path
function getResourcePath(resourceName) {
  return __dirname + '/../resources/' + resourceName;
}
