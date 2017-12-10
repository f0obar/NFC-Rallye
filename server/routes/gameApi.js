const express = require('express');
const router = express.Router();

const Location = require('../models/location');
const Riddle = require('../models/riddle');
const SolvedRiddle = require('../models/solvedRiddle');
const Tag = require('../models/tag');
const PlaySession = require('../models/playSession');

const ResponseHandler = require('../util/responsehandler');

const gameService = require('../services/gameService');

router.post('/sessions', startPlaySession);
router.delete('/sessions/:sessionid', deletePlaySession);
router.get('/sessions/:sessionid', getState);
router.post('/sessions/:sessionid/riddle', solveRiddle);
router.post('/sessions/:sessionid/location', checkLocation);

const SINGLE_ANSWER_POINTS = 20;
const MULTI_ANSWER_POINTS = 20;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getAndRemoveRandomElement(arr) {
  return arr.splice(getRandomInt(0, arr.length), 1)[0];
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

// Will return the sessionid of the playsession
async function startPlaySession(req, res, next) {
  try {
    const session = await gameService.createSession(req.body.groupName, req.body.password);
    await advanceState(session);
    res.send(session._id)
  } catch (err) {
    res.status(400);
    res.send({"error": err.message});
  }
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

async function _saveState(playSession) {
  await playSession.save();
}

function _saveSolvedRiddles(solvedRiles, res, callback) {
  solvedRiles.save(function (err, savedSolvedRiles) {
    if (err) {
      res.send(err);
      return;
    }
    if (callback) {
      callback(savedSolvedRiles);
    }
  });
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
  await _saveState(playSession);
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

async function deletePlaySession(req, res, next) {
  const id = req.params.sessionid;
  try {
    await gameService.destroySession(id);
    res.send({deleted: true});
  } catch (err) {
    res.send(err);
  }
}

async function getState(req, res, next) {
  const handler = ResponseHandler(res);
  const sessionID = req.params.sessionid;

  try {
    const result = await gameService.getGameState(sessionID);
    handler.success(result);
  } catch (err) {
    handler.error(err)
  }
}

// Will return whether the sent solution was right
async function solveRiddle(req, res, next) {
  const sessionID = req.params.sessionid;
  const answer = req.body.answer;
  const skip = req.body.skip;
  console.log("solveRiddle:", req.body);
  if (!skip) {
    if (!answer) {
      res.send(new Error('No answer provided'));
      return;
    }
  }

  const session = await PlaySession.findById(sessionID).exec();
  if (!session) {
    throw new Error('Invalid session');
  }

  session.lastUpdated = new Date();
  if (session.task !== 'solveRiddle') {
    throw new Error('Not the time to solve riddles.');
  }

  const riddle = await Riddle.findById(session.riddle).exec();
  const solvedRiddle = await SolvedRiddle.findById(session.solvedRiddles[session.solvedRiddles.length - 1]).exec();

  if (skip) {
    solvedRiddle.skipped = true;
    solvedRiddle.points = 0;
    solvedRiddle.endDate = new Date();
    await advanceState(session);
    await _saveSolvedRiddles(solvedRiddle);
    res.send({correctAnswer: true, points: solvedRiddle.points});
  } else {
    solvedRiddle.skipped = false;
    solvedRiddle.tries++;

    if (riddle.answer.toLowerCase().trim() === answer.toLowerCase().trim()) {
      solvedRiddle.points = _getPoints(riddle, solvedRiddle);
      solvedRiddle.endDate = new Date();
      session.points += solvedRiddle.points;
      await advanceState(session);
      await _saveSolvedRiddles(solvedRiddle);
      res.send({correctAnswer: true, points: session.points});
    } else {
      await _saveSolvedRiddles(solvedRiddle);
      res.send({correctAnswer: false, points: session.points});
    }
  }
}

function _getPoints(riddle, solvedRiddle) {
  if (riddle.choices.length === 0) {
    return SINGLE_ANSWER_POINTS;
  } else {
    return Math.floor(MULTI_ANSWER_POINTS / solvedRiddle.tries);
  }
}

async function updateHeat(location, change) {
  if (location.heat + change >= 0) {
    location.heat += change;
    await location.save();
  }
}

// Will check if the location is right. if it is, will allow to solve riddle
async function checkLocation(req, res, next) {
  const sessionID = req.params.sessionid;
  const tagID = req.body.tagID;
  const skip = req.body.skip;
  try {
    res.send(await gameService.checkLocation(sessionID, tagID, skip));
  } catch (err) {
    res.send(err);
  }
}

//cleanup and stuff
async function heatCountdown() {
  const locations = await Location.find();

  await locations.forEach(async function (location) {
    await updateHeat(location, -1);
  });
}

function sessionDeleter() {
  console.log('Cleaning up sessions:')
  PlaySession.find(function (err, sessions) {
    if (err) {
      console.log('ERROR: ' + err);
      return;
    }
    const currentTime = Date.now();
    sessions.forEach(function (session) {
      if (currentTime > session.lastUpdated.getTime() + sessionToDeleteTime) {
        session.remove(function (err) {
          if (err) {
            console.log(err);
          }
        });
      }
    });
  });
}

const sessionToDeleteTime = 1000 * 60 * 60 * 24 * 3; //3 Days

setInterval(heatCountdown, 1000 * 60 * 8);
setInterval(sessionDeleter, 1000 * 60 * 60);


module.exports = router;