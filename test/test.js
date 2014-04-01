/* jshint expr:true */

var chai = require('chai');
var expect = chai.expect;

var baller = require('../lib');

describe('Baller', function () {
  it('should have create function', function () {
    expect(baller.create).to.exist;
  });

  it('should have init function', function () {
    expect(baller.init).to.exist;
  });

  it('should have update function', function () {
    expect(baller.update).to.exist;
  });

  it('should have unball function', function () {
    expect(baller.unball).to.exist;
  });

  it('should have deploy function', function () {
    expect(baller.deploy).to.exist;
  });

  it('should fail to create ball without name', function () {
    expect(baller.create).to.throw(/name/);
  });
});
