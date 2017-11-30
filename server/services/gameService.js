const Config = require('../models/config');
const PlaySession = require('../models/playSession');
const Tag = require('../models/tag');

async function getGameState(sessionID) {
  const session = await PlaySession.findById(sessionID)
    .populate('location')
    .populate('riddle')
    .exec();

  if (session === null) {
    throw new Error('Session doesn\'t exist');
  }

  const result = {
    task: session.task,
    progress: {
      count: session.locationCount,
      done: session.locationCount - session.locationsToVisit.length - (session.task === 'findLocation' ? 1 : 0)
    },
    dates: {
      startDate: session.startDate,
      endDate: session.endDate
    }
  };

  if (session.task === 'won') {
    result.winText = await Config.get('winText');
    return result;
  } else {
    if (!session.location) {
      throw new Error("location not found, session is invalid");
    }
    result.points = session.points;
    result.location = filterObject(session.location, ['name', 'image']);
    result.riddle = filterObject(session.riddle, ['name', 'choices', 'description', 'hint', 'image']);
    return result;
  }
}

async function checkLocation(sessionID, tagID) {
  const session = await PlaySession.findById(sessionID);
  if (!session) {
    throw new Error('Invalid session');
  }
  session.lastUpdated = new Date();

  if (session.task !== 'findLocation') {
    throw new Error('Not the time to solve riddles.');
  }
  const tag = await Tag.findOne({'tagID': tagID});
  if (!tag) {
    throw new Error('Invalid tag');
  }
  if (session.location.equals(tag.location)) {
    // Correct location, lets update the session then
    session.task = 'solveRiddle';
    await session.save();
    return {correctLocation: true};
  } else {
    return {correctLocation: false};
  }
}

function filterObject(obj, keys) {
  const filteredObj = {};
  keys.forEach(function (key) {
    filteredObj[key] = obj[key];
  });
  return filteredObj;
}

module.exports = {
  getGameState,
  checkLocation
};