const Config = require('../models/config');
const PlaySession = require('../models/playSession');
const Tag = require('../models/tag');
const Riddle = require('../models/riddle');
const SolvedRiddle = require('../models/solvedRiddle');

const bcrypt = require('bcryptjs');

const LOCATION_VISIT_POINTS = 20;

function getAndRemoveRandomElement(arr) {
  return arr.splice(getRandomInt(0, arr.length), 1)[0];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function uniqueFilter(property) {
  const foundElements = {};
  return function (el) {
    if (foundElements.hasOwnProperty(el[property])) {
      return false;
    }
    foundElements[el[property]] = true;
    return true;
  }
}

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
    },
    points: session.points
  };

  if (session.task === 'won') {
    result.winText = await Config.get('winText');
    return result;
  } else {
    if (!session.location) {
      throw new Error("location not found, session is invalid");
    }
    result.location = filterObject(session.location, ['name', 'image']);
    result.riddle = filterObject(session.riddle, ['name', 'choices', 'description', 'hint', 'image']);
    return result;
  }
}

async function checkLocation(sessionID, tagID, skip) {
  const session = await PlaySession.findById(sessionID);
  if (!session) {
    throw new Error('Invalid session');
  }
  session.lastUpdated = new Date();

  if (session.task !== 'findLocation') {
    throw new Error('Not the time to solve riddles.');
  }

  if (!skip) {
    const tag = await Tag.findOne({'tagID': tagID});
    if (!tag) {
      throw new Error('Invalid tag');
    }
    if (session.location.equals(tag.location)) {
      // Correct location, lets update the session then
      session.task = 'solveRiddle';
      session.points += LOCATION_VISIT_POINTS;
      await session.save();
      return {correctLocation: true, points: session.points};
    } else {
      return {correctLocation: false, points: session.points};
    }
  } else {
    // Skipped location.
    session.task = 'solveRiddle';
    await session.save();
    return {correctLocation: true, points: session.points};
  }
}

async function createSession(groupName, password) {
  if (!groupName) {
    throw new Error('No Group Name provided');
  }

  const tags = await Tag.find().populate('location').exec();
  const activeTags = tags.filter(function (tag) {
    return (tag.location && tag.location.isActive === true);
  }).filter(uniqueFilter('location'));

  console.log("activeTags", activeTags);
  let locationCount = activeTags.length;

  const riddles = await Riddle.find().populate('location').exec();

  const nonLocationRiddles = riddles.filter(function (riddle) {
    return ((!riddle.location || riddle.location == null) && riddle.isActive);
  });

  const locationRiddles = riddles.filter(function (riddle) {
    return (riddle.location && riddle.location.isActive === true && riddle.isActive);
  });

  /**
   * selects all inactive quizzes
   */
  const inactiveRiddles = riddles.filter(function (riddle) {
    return (!riddle.isActive);
  });

  // console.log("nonLocationRiddles", nonLocationRiddles);
  // console.log("locationRiddles", locationRiddles);
  // console.log("inactiveRiddles", inactiveRiddles);

  const riddlecount = nonLocationRiddles.length + locationRiddles.length;
  //TODO way more complicated then this
  /**
   * starts new session only when enough quizzes are available
   */
  if (locationCount > 0 && riddlecount >= locationCount) {

    const oldSession = await PlaySession.findOne({"groupName": groupName});
    if (oldSession) {
      if (password) {
        if (bcrypt.compareSync(password, oldSession.password)) {
          console.log("Restoring old Session: " + oldSession._id);
          oldSession.passwordTries = 0;
          oldSession.save();
          return oldSession;
        } else {
          oldSession.passwordTries++;
          oldSession.save();
          throw new Error("Wrong password");
        }
      } else {
        throw new Error("Group name already exists");
      }
    }
    const playSession = new PlaySession();
    playSession.groupName = groupName;
    playSession.password = bcrypt.hashSync(password, 10);
    playSession.startDate = new Date();
    console.log("Generate new PlaySession: " + playSession._id);
    await advanceState(playSession);
    return playSession;
  } else {
    throw new Error('Not enough riddles in the database');
  }
}

async function destroySession(sessionID) {
  await PlaySession.remove({_id: sessionID});
}

async function advanceState(playSession) {
  console.log("Advance state of session:", playSession._id);
  playSession.lastUpdated = new Date();
  playSession.task = 'findLocation';

  const tags = await Tag.find().populate('location').exec();
  const activeTags = tags.filter(function (tag) {
    return (tag.location && tag.location.isActive === true);
  }).filter(uniqueFilter('location'));

  if (!playSession.locationCount) {
    playSession.locationCount = activeTags.length;
    playSession.locationsToVisit = activeTags.map(function (tag) {
      return tag.location._id;
    });
  }

  if (playSession.locationsToVisit.length === 0) {
    playSession.task = 'won';
    playSession.endDate = new Date();
    await _finishAdvanceState(playSession);
  } else {
    const locations = activeTags.map(function (tag) {
      return tag.location;
    });
    playSession.location = await _getLocationID(playSession, locations);
    await _finishAdvanceState(playSession);
  }
}

async function _getLocationID(session, locations) {
  const objLocationsToVisit = locations.filter(function (location) {
    return session.locationsToVisit.indexOf(location._id) !== -1;
  });

  const result = objLocationsToVisit.sort(function () {
    return Math.random();
  }).sort(function (a, b) {
    return a.heat - b.heat;
  })[0];

  session.locationsToVisit.splice(session.locationsToVisit.indexOf(result._id), 1);
  await updateHeat(result, 1);
  return result._id;
}

async function _finishAdvanceState(playSession) {
  if (playSession.task !== 'won') {
    const riddles = await Riddle.find().exec();
    if (!riddles || riddles.length === 0) {
      throw new Error('no Riddles in database');
    }
    playSession.riddle = _getRiddleID(playSession, riddles);
    const solvedRiddle = new SolvedRiddle();
    solvedRiddle.riddle = playSession.riddle;
    solvedRiddle.tries = 0;
    solvedRiddle.startDate = new Date();
    SolvedRiddle.create(solvedRiddle);

    playSession.solvedRiddles.push(solvedRiddle);
  }
  await playSession.save();
}

function _getRiddleID(session, riddles) {
  const unusedRiddles = riddles.filter(function (riddle) {
    return session.solvedRiddles.indexOf(riddle._id) === -1;
  });

  const nonLocationRiddles = unusedRiddles.filter(function (riddle) {
    return ((!riddle.location || riddle.location == null) && riddle.isActive);
  });

  const locationRiddles = unusedRiddles.filter(function (riddle) {
    return (riddle.location && riddle.location.equals(session.location) && riddle.isActive);
  });

  if (locationRiddles.length > 0) {
    return getAndRemoveRandomElement(locationRiddles)._id;
  }
  return getAndRemoveRandomElement(nonLocationRiddles)._id;
}

async function updateHeat(location, change) {
  if (location.heat + change >= 0) {
    location.heat += change;
    await location.save();
  }
}

async function heatCountdown() {
  const locations = await Location.find();

  await locations.forEach(async function (location) {
    await updateHeat(location, -1);
  });
}

function filterObject(obj, keys) {
  const filteredObj = {};
  keys.forEach(function (key) {
    filteredObj[key] = obj[key];
  });
  return filteredObj;
}

setInterval(heatCountdown, 1000 * 60 * 8);

module.exports = {
  getGameState,
  checkLocation,
  createSession,
  destroySession,
  advanceState
};