#!/usr/bin/env node

var program = require('commander');
var pkg = require('../package.json');

program
  .version(pkg.version);

program
  .command('create <name>')
  .description('Create a new, empty ball in a new directory')
  .action(function (name) {
    console.log('creating: ' + name);
  });

program
  .command('init')
  .description('Initialize current directory and files as a ball')
  .action(function () {
    console.log('initing');
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
