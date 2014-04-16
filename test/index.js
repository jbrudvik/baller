/* jshint expr:true */
/* global describe, it, beforeEach, afterEach */

var expect = require('chai').expect;
var sinon = require('sinon');
var mockfs = require('mock-fs');
var _ = require('underscore');
var path = require('path');
var fs = require('fs');

var baller = require('../lib');
var pkg = require('../package.json');


// Expected Baller files and directories
var BALLER_META_DIR = '.baller';
var VERSION_FILE = 'version';
var README_FILE = 'README.md';
var LICENSE_FILE = 'LICENSE';
var FILES_FILE = 'files';
var BALLER_SCRIPTS = [
  'backup',
  'install',
  'uninstall',
  'update',
  'pre-install',
  'post-install',
  'remove-backups',
  'restore',
  'pre-update',
  'post-update'
];


describe('Baller', function () {

  // Use a mock filesystem so these tests do not write to the actual
  // filesystem. Include Baller internal files in the mock filesystem as these
  // are needed for Baller to operate.
  beforeEach(function () {
    var ballerPath = path.normalize(path.join(__dirname, '..'));
    var toIgnore = [
      '.git',
      'node_modules',
      '.DS_Store'
    ];
    var contents = getDirDeepContents(ballerPath, toIgnore);
    mockfs(contents);
  });

  // Restore original filesystem. Don't keep filesystem changes across tests.
  afterEach(mockfs.restore);


  describe('API', function () {
    it('includes create', function () {
      expect(baller.create).to.exist;
    });

    it('includes init', function () {
      expect(baller.init).to.exist;
    });

    it('includes update', function () {
      expect(baller.update).to.exist;
    });

    it('includes unball', function () {
      expect(baller.unball).to.exist;
    });

    it('includes deploy', function () {
      expect(baller.deploy).to.exist;
    });
  });


  describe('#create', function () {
    var name = 'foo';

    it('fails to create ball without name', function () {
      expect(baller.create).to.throw(/name/i);
    });

    it('fails to create ball if directory with name already exists', function () {
      fs.mkdirSync(name);
      expect(baller.create.bind(baller, name)).to.throw(/directory/i);
    });

    it('returns success message on success', function () {
      expect(baller.create(name)).to.match(/create/i);
    });

    describe('creates a new ball', function () {
      beforeEach(function () {
        baller.create(name);
      });

      it('in a new directory', function () {
        expect(fs.existsSync(name)).to.be.true;
      });

      it('which includes Baller metadata', function () {
        expect(fs.existsSync(path.join(name, BALLER_META_DIR))).to.be.true;
      });

      it('which has correct Baller version metadata', function () {
        var versionFilePath = path.join(name, BALLER_META_DIR, VERSION_FILE);
        var ballVersion = fs.readFileSync(versionFilePath).toString();
        expect(ballVersion).to.equal(pkg.version);
      });

      it('which includes a README', function () {
        expect(fs.existsSync(path.join(name, README_FILE))).to.be.true;
      });

      it('which includes a `files` file', function () {
        expect(fs.existsSync(path.join(name, FILES_FILE))).to.be.true;
      });

      it('which includes all Baller scripts', function () {
        _.each(BALLER_SCRIPTS, function (script) {
          expect(fs.existsSync(path.join(name, script))).to.be.true;
        });
      });
    });
  });


  describe('#init', function () {

    // baller.init uses process.cwd initialize the current directory as a ball.
    // Create a new directory and "change" the current working directory to it
    // by stubbing process.cwd to return the path of the new directory.
    beforeEach(function () {
      var dir = 'foo';
      var cwd = path.join(process.cwd(), dir);
      fs.mkdirSync(dir);
      sinon.stub(process, 'cwd').returns(cwd);
    });

    // "Change" back to the original working directory by restoring process.cwd
    // to its real implementation
    afterEach(function () {
      process.cwd.restore();
    });

    it('fails to initialize ball if directory is already a ball', function () {
      baller.init();
      expect(baller.init).to.throw(/already/i);
    });

    it('returns success message on success', function () {
      expect(baller.init()).to.match(/init/i);
    });


    describe('initializes a new ball', function () {
      beforeEach(baller.init);

      it('which includes Baller metadata', function () {
        expect(fs.existsSync(BALLER_META_DIR)).to.be.true;
      });

      it('which has correct Baller version metadata', function () {
        var versionFilePath = path.join(BALLER_META_DIR, VERSION_FILE);
        var ballVersion = fs.readFileSync(versionFilePath).toString();
        expect(ballVersion).to.equal(pkg.version);
      });

      it('which includes a README', function () {
        expect(fs.existsSync(README_FILE)).to.be.true;
      });

      it('which includes a `files` file', function () {
        expect(fs.existsSync(FILES_FILE)).to.be.true;
      });

      it('which includes all Baller scripts', function () {
        _.each(BALLER_SCRIPTS, function (script) {
          expect(fs.existsSync(script)).to.be.true;
        });
      });
    });


    describe('when called in a directory containing no files', function () {
      beforeEach(baller.init);

      it('initializes a ball with no entries in `files` file', function () {
        var filesFileContents = fs.readFileSync(FILES_FILE).toString();
        expect(filesFileContents.trim()).to.be.empty;
      });
    });


    describe('when called in a directory containing files', function () {
      var existingFiles = [
        'one',
        'two',
        'three'
      ];

      beforeEach(function () {
        _.each(existingFiles, function (existingFile) {
          fs.writeFile(existingFile);
        });
        baller.init();
      });

      it('initializes a ball with entries for each existing file in `files` file', function () {
        var filesFileContents = fs.readFileSync(FILES_FILE).toString();
        var filesFileEntries = filesFileContents.trim().split(/\s+/);
        expect(filesFileEntries).to.have.members(existingFiles);
      });
    });


    describe('when called in a directory containing directories', function () {
      var existingDirs = [
        'foo',
        'bar',
        'baz'
      ];

      beforeEach(function () {
        _.each(existingDirs, function (existingDir) {
          fs.mkdirSync(existingDir);
        });
        baller.init();
      });

      it('initializes a ball with no entries in `files` file', function () {
        var filesFileContents = fs.readFileSync(FILES_FILE).toString();
        expect(filesFileContents.trim()).to.be.empty;
      });
    });


    describe('when called in a directory containing ignored files', function () {
      var nonIgnoredFiles = [
        'one',
        'two',
        'three'
      ];

      var ignoredFiles = [
        README_FILE,
        LICENSE_FILE,
        FILES_FILE
      ].concat(BALLER_SCRIPTS);

      beforeEach(function () {
        var existingFiles = nonIgnoredFiles.concat(ignoredFiles);
        _.each(existingFiles, function (existingFile) {
          fs.writeFile(existingFile);
        });
        baller.init();
      });

      it('initializes a ball with entries for all non-ignored files only `files` file', function () {
        var filesFileContents = fs.readFileSync(FILES_FILE).toString();
        var filesFileEntries = filesFileContents.trim().split(/\s+/);
        expect(filesFileEntries).to.have.members(nonIgnoredFiles);
      });
    });


    describe('when called in a directory containing files and directories', function () {
      var existingFiles = [
        'one',
        'two',
        'three'
      ];
      var existingDirs = [
        'foo',
        'bar',
        'baz'
      ];

      beforeEach(function () {
        _.each(existingFiles, function (existingFile) {
          fs.writeFile(existingFile);
        });
        _.each(existingDirs, function (existingDir) {
          fs.mkdirSync(existingDir);
        });
        baller.init();
      });

      it('initializes a ball with entries for all files only in `files` file', function () {
        var filesFileContents = fs.readFileSync(FILES_FILE).toString();
        var filesFileEntries = filesFileContents.trim().split(/\s+/);
        expect(filesFileEntries).to.have.members(existingFiles);
      });
    });
  });


  describe('#unball', function () {

    describe('when called in a directory that is a ball', function () {

      var name = 'foo';

      beforeEach(function () {
        baller.create(name);
        var cwd = path.join(process.cwd(), name);
        sinon.stub(process, 'cwd').returns(cwd);
      });

      afterEach(function () {
        process.cwd.restore();
      });

      it('returns success message on success', function () {
        expect(baller.unball()).to.match(/unball/i);
      });
    });
  });
});


/*
 * Return an object, potentially nested, representing the contents of the
 * given Node fs dir. Directory values are objects with keys of contained
 * directory or file names. File values are Node Buffer objects.
 *
 * Directory and file names contained in the toIgnore parameter are omitted.
 */
function getDirDeepContents(dir, toIgnore) {
  var files = fs.readdirSync(dir);
  var tree = {};
  _.each(files, function (file) {
    if (!_.contains(toIgnore, file)) {
      var fullPath = path.join(dir, file);
      tree[file] = fs.statSync(fullPath).isDirectory() ?
        getDirDeepContents(fullPath, toIgnore) : fs.readFileSync(fullPath);
    }
  });
  return tree;
}
