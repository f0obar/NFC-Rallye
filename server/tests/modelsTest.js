const chai = require("chai");
const mongoose = require('mongoose');
const chaiAsPromised = require("chai-as-promised");

const PlaySession = require('../models/playSession');
const Location = require('../models/location');

const assert = chai.assert;
chai.use(chaiAsPromised);
mongoose.Promise = Promise;

describe('PlaySession Model Tests', function () {
  it('Should be rejected because no groupName was provided', function () {
    const session = new PlaySession();
    return assert.isRejected(session.validate());
  });

  it('Should be fulfilled because groupName was provided', function () {
    const session = new PlaySession({"groupName": "test"});
    return assert.isFulfilled(session.validate());
  });
});

describe('LocationSchema Model Tests', function () {
  it('Should be rejected because no name was provided', function () {
    const location = new Location();
    return assert.isRejected(location.validate());
  });

  it('Should be fulfilled because name was provided', function () {
    const location = new Location({"name": "test location"});
    return assert.isFulfilled(location.validate());
  });
});