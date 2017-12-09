const Config = require('../models/config');
const PlaySession = require('../models/playSession');
const Tag = require('../models/tag');
const Riddle = require('../models/riddle');

const bcrypt = require('bcryptjs');

const LOCATION_VISIT_POINTS = 20;

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
    return playSession;
  } else {
    throw new Error('Not enough riddles in the database');
  }
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

function filterObject(obj, keys) {
  const filteredObj = {};
  keys.forEach(function (key) {
    filteredObj[key] = obj[key];
  });
  return filteredObj;
}

module.exports = {
  getGameState,
  checkLocation,
  createSession
};