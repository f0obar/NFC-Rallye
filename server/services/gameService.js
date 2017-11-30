const Config = require('../models/config');
const PlaySession = require('../models/playSession');

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

function filterObject(obj, keys) {
  const filteredObj = {};
  keys.forEach(function (key) {
    filteredObj[key] = obj[key];
  });
  return filteredObj;
}

module.exports = {
  getGameState
};