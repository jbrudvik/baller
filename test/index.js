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
var FILES_DIR = 'files';
var SCRIPTS_DIR = 'scripts';
var HOOKS_DIR = 'hooks';
var SCRIPTS = getVisibleFiles(SCRIPTS_DIR);
var HOOKS = getVisibleFiles(path.join(SCRIPTS_DIR, HOOKS_DIR));


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

    it('includes destroy', function () {
      expect(baller.destroy).to.exist;
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

      it('which includes a `files` subdirectory', function () {
        var filesDir = path.join(name, FILES_DIR);
        expect(fs.existsSync(filesDir)).to.be.true;
        expect(fs.statSync(filesDir).isDirectory()).to.be.true;
      });

      it('which includes all Baller scripts', function () {
        expect(fs.readdirSync(name)).to.include.members(SCRIPTS);
        expect(fs.readdirSync(path.join(name, 'hooks'))).to.include.members(HOOKS);
      });
    });
  });


  describe('#init', function () {
    var filesDir;

    // baller.init uses process.cwd initialize the current directory as a ball.
    // Create a new directory and "change" the current working directory to it
    // by stubbing process.cwd to return the path of the new directory.
    beforeEach(function () {
      var dir = 'foo';
      var cwd = path.join(process.cwd(), dir);
      fs.mkdirSync(dir);
      sinon.stub(process, 'cwd').returns(cwd);
      filesDir = path.join('.', FILES_DIR);
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

      it('which includes a `files` subdirectory', function () {
        expect(fs.existsSync(filesDir)).to.be.true;
        expect(fs.statSync(filesDir).isDirectory()).to.be.true;
      });

      it('which includes all Baller scripts', function () {
        expect(fs.readdirSync('.')).to.include.members(SCRIPTS);
        expect(fs.readdirSync(path.join('.', 'hooks'))).to.include.members(HOOKS);
      });
    });


    describe('when called in a directory containing no files', function () {
      beforeEach(baller.init);

      it('initializes a ball with an empty `files` subdirectory', function () {
        expect(fs.readdirSync(filesDir)).to.be.empty;
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
          fs.writeFileSync(existingFile);
        });
        baller.init();
      });

      it('initializes a ball with all existing files moved to `files` subdirectory', function () {
        expect(fs.readdirSync(filesDir)).to.have.members(existingFiles);
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

      it('initializes a ball with existing directories moved to `files` subdirectory', function () {
        expect(fs.readdirSync(filesDir)).to.have.members(existingDirs);
      });
    });


    describe('when called in a directory containing ignored files', function () {
      var nonIgnoredFiles = [
        'one',
        'two',
        'three',
        FILES_DIR
      ].concat(SCRIPTS);
      var ignoredDirs = [
        '.git'
      ];

      beforeEach(function () {
        _.each(nonIgnoredFiles, function (nonIgnoredFile) {
          fs.writeFileSync(nonIgnoredFile);
        });
        _.each(ignoredDirs, function (ignoredDir) {
          fs.mkdir(ignoredDir);
        });
        baller.init();
      });

      it('initializes a ball with all non-ignored files moved to `files` subdirectory', function () {
        expect(fs.readdirSync(filesDir)).to.have.members(nonIgnoredFiles);
      });
    });


    describe('when called in a directory containing files and directories', function () {
      var existingFiles = [
        'one',
        'two',
        'three',
        FILES_DIR
      ];
      var existingDirs = [
        'foo',
        'bar',
        'baz'
      ];

      beforeEach(function () {
        _.each(existingFiles, function (existingFile) {
          fs.writeFileSync(existingFile);
        });
        _.each(existingDirs, function (existingDir) {
          fs.mkdirSync(existingDir);
        });
        baller.init();
      });

      it('initializes a ball with all non-ignored files and directories moved to `files` subdirectory', function () {
        expect(fs.readdirSync(filesDir)).to.have.members(existingFiles.concat(existingDirs));
      });
    });


    describe('when called in a directory containing `files` subdirectory', function () {
      beforeEach(function () {
        fs.mkdirSync(filesDir);
      });

      it('initializes a ball with `files` subdirectory in `files` subdirectory', function () {
        expect(baller.init).to.not.throw(Error);
        expect(fs.statSync(path.join(filesDir, 'files')).isDirectory()).to.be.true;
      });
    });


    describe('when called in a directory containing `files` file', function () {
      var fileContent = 'hello';

      beforeEach(function () {
        fs.writeFileSync(filesDir, fileContent);
      });

      it('initializes a ball with `files` file with correct contents in `files` subdirectory', function () {
        expect(baller.init).to.not.throw(Error);
        expect(fs.statSync(path.join(filesDir, 'files')).isFile()).to.be.true;
        expect(fs.readFileSync(path.join(filesDir, 'files')).toString()).to.equal(fileContent);
      });
    });
  });


  describe('#destroy', function () {
    var name = 'foo';

    describe('when called in a directory that is an empty ball', function () {

      beforeEach(function () {
        baller.create(name);
        var cwd = path.join(process.cwd(), name);
        sinon.stub(process, 'cwd').returns(cwd);
      });

      afterEach(function () {
        process.cwd.restore();
      });

      it('returns success message on success', function () {
        expect(baller.destroy()).to.match(/destroy/i);
      });

      it('removes all files in directory', function () {
        baller.destroy();
        expect(fs.readdirSync('.')).to.be.empty;
      });
    });


    describe('when called in a directory that is a non-empty ball', function () {
      var existingFiles = [
        'one',
        'two',
        'three'
      ];

      beforeEach(function () {
        fs.mkdir(name);
        _.each(existingFiles, function (existingFile) {
          fs.writeFileSync(path.join(name, existingFile));
        });
        var cwd = path.join(process.cwd(), name);
        sinon.stub(process, 'cwd').returns(cwd);
        baller.init();
      });

      afterEach(function () {
        process.cwd.restore();
      });

      it('returns success message on success', function () {
        expect(baller.destroy()).to.match(/destroy/i);
      });

      it('removes all files in directory except original files', function () {
        baller.destroy();
        expect(fs.readdirSync('.')).to.have.members(existingFiles);
      });
    });

    describe('when called in a directory that is a non-empty ball with a `files` file', function () {
      var existingFiles = [
        'one',
        'two',
        'three',
        FILES_DIR
      ];

      beforeEach(function () {
        fs.mkdir(name);
        _.each(existingFiles, function (existingFile) {
          fs.writeFileSync(path.join(name, existingFile));
        });
        var cwd = path.join(process.cwd(), name);
        sinon.stub(process, 'cwd').returns(cwd);
        baller.init();
      });

      afterEach(function () {
        process.cwd.restore();
      });

      it('removes all files in directory except original files', function () {
        baller.destroy();
        expect(fs.readdirSync('.')).to.have.members(existingFiles);
      });
    });


    describe('when called in a directory that is not a ball', function () {
      var existingFiles = [
        'one',
        'two',
        'three',
        README_FILE,
        FILES_DIR
      ].concat(SCRIPTS);

      beforeEach(function () {
        fs.mkdir(name);
        _.each(existingFiles, function (existingFile) {
          fs.writeFileSync(path.join(name, existingFile));
        });
        var cwd = path.join(process.cwd(), name);
        sinon.stub(process, 'cwd').returns(cwd);
      });

      afterEach(function () {
        process.cwd.restore();
      });

      it('fails to destroy', function () {
        expect(baller.destroy).to.throw(/not/i);
      });

      it('removes no files', function () {
        try {
          baller.destroy();
        } catch (e) {
        } finally {
          expect(fs.readdirSync('.')).to.have.members(existingFiles);
        }
      });
    });
  });
});


/*
 * Return a list of file names containing visible files in a directory.
 *
 * Synchronous. Does not include non-files (e.g., directories).
 */
function getVisibleFiles(dir) {
  return _.chain(fs.readdirSync(dir))
    .filter(function (file) {
      // Must be a file
      return fs.statSync(path.join(dir, file)).isFile();
    })
    .filter(function (file) {
      // Must be visible (not start with .)
      return !/^\./.test(file);
    })
    .value();
}

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
