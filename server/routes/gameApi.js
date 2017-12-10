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

// Will return the sessionid of the playsession
async function startPlaySession(req, res, next) {
  try {
    const session = await gameService.createSession(req.body.groupName, req.body.password);
    res.send(session._id)
  } catch (err) {
    res.status(400);
    res.send({"error": err.message});
  }
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
    await gameService.advanceState(session);
    await _saveSolvedRiddles(solvedRiddle);
    res.send({correctAnswer: true, points: solvedRiddle.points});
  } else {
    solvedRiddle.skipped = false;
    solvedRiddle.tries++;

    if (riddle.answer.toLowerCase().trim() === answer.toLowerCase().trim()) {
      solvedRiddle.points = _getPoints(riddle, solvedRiddle);
      solvedRiddle.endDate = new Date();
      session.points += solvedRiddle.points;
      await gameService.advanceState(session);
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

setInterval(sessionDeleter, 1000 * 60 * 60);

module.exports = router;