/* jshint expr:true */

var chai = require('chai');
var expect = chai.expect;

var baller = require('../lib');

describe('Baller', function () {
  it('should have create function', function () {
    expect(baller.create).to.exist;
  });
});
