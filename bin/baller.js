#!/usr/bin/env node

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
    console.log(renderReadme(name));
  });

program
  .command('init')
  .description('Initialize current directory and files as a ball')
  .action(function () {
    console.log('initing' + '\n');
    var name = path.basename(process.cwd());
    console.log(renderReadme(name));
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


// Render template resource with given context and return result
function renderTemplate(template, context) {
  var source = fs.readFileSync(getTemplatePath(template)).toString();
  var compiledTemplate = handlebars.compile(source);
  return compiledTemplate(context);
}

// Return path for template
function getTemplatePath(template) {
  return __dirname + '/../templates/' + template;
}

// Render README for current user with given ball name and return result
function renderReadme(name) {
  var context = {
    name: name,
    username: process.env.USER
  };
  return renderTemplate('README.md.hbs', context);
}
