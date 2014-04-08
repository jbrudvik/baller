/* jshint expr:true */
/* global describe, it, beforeEach, afterEach */

var _ = require('underscore');
var fs = require('fs');
var mock = require('mock-fs');
var path = require('path');
var expect = require('chai').expect;

var baller = require('../lib');
var pkg = require('../package.json');


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
    mock(contents);
  });

  // Restore original filesystem. Don't keep filesystem changes across tests.
  afterEach(mock.restore);

  describe('API', function () {
    it('should include create', function () {
      expect(baller.create).to.exist;
    });

    it('should include init', function () {
      expect(baller.init).to.exist;
    });

    it('should include update', function () {
      expect(baller.update).to.exist;
    });

    it('should include unball', function () {
      expect(baller.unball).to.exist;
    });

    it('should include deploy', function () {
      expect(baller.deploy).to.exist;
    });
  });

  describe('#create', function () {
    var name = 'foo';

    it('should fail to create ball without name', function () {
      expect(baller.create).to.throw(/name/i);
    });

    it('should fail to create ball if directory with name already exists', function () {
      fs.mkdir(name);
      expect(baller.create.bind(baller, name)).to.throw(/directory/i);
    });

    it('should return success message on success', function () {
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
        expect(fs.existsSync(path.join(name, '.baller'))).to.be.true;
      });

      it('which has correct Baller version metadata', function () {
        var versionFilePath = path.join(name, '.baller', 'version');
        var ballVersion = fs.readFileSync(versionFilePath).toString();
        expect(ballVersion).to.equal(pkg.version);
      });

      it('which includes a README', function () {
        expect(fs.existsSync(path.join(name, 'README.md'))).to.be.true;
      });

      it('which includes a `files` file', function () {
        expect(fs.existsSync(path.join(name, 'files'))).to.be.true;
      });

      it('which includes all Baller scripts', function () {
        var scripts = [
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
        _.each(scripts, function (script) {
          expect(fs.existsSync(path.join(name, script))).to.be.true;
        });
      });
    });
  });

  describe('#init', function () {
    it('should return success message on success', function () {
      expect(baller.init()).to.match(/init/i);
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
