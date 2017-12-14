const express = require('express');
const router = express.Router();

const Riddle = require('../models/riddle');
const SolvedRiddle = require('../models/solvedRiddle');
const PlaySession = require('../models/playSession');

const ResponseHandler = require('../util/responsehandler');
const UserException = require('../exceptions/userexception');

const gameService = require('../services/gameService');
const scoreBoardService = require('../services/scoreboardService');

router.post('/sessions', startPlaySession);
router.delete('/sessions/:token', deletePlaySession);
router.get('/sessions/:token', getState);
router.post('/sessions/:token/riddle', solveRiddle);
router.post('/sessions/:token/location', checkLocation);

const SINGLE_ANSWER_POINTS = 20;
const MULTI_ANSWER_POINTS = 20;

// Will return the access token of the session
async function startPlaySession(req, res, next) {
  try {
    const session = await gameService.createSession(req.body.groupName, req.body.password);
    await scoreBoardService.pushScoreboard();
    res.send({token: session.token})
  } catch (err) {
    if (err instanceof UserException) {
      res.status(400);
      res.send({"error": err});
    } else {
      console.error(err);
      res.status(500);
    }
  }
}

async function deletePlaySession(req, res, next) {
  try {
    await gameService.destroySession(req.params.token);
    await scoreBoardService.pushScoreboard();
    res.send({deleted: true});
  } catch (err) {
    res.send(err);
  }
}

async function getState(req, res, next) {
  const handler = ResponseHandler(res);
  try {
    const result = await gameService.getGameState(req.params.token);
    handler.success(result);
  } catch (err) {
    handler.error(err)
  }
}

// Will return whether the sent solution was right
async function solveRiddle(req, res, next) {
  const token = req.params.token;
  const answer = req.body.answer;
  const skip = req.body.skip;
  console.log("solveRiddle:", req.body);
  if (!skip) {
    if (!answer) {
      res.send(new Error('No answer provided'));
      return;
    }
  }

  const session = await PlaySession.findOne({"token": token}).exec();
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
    await _finishSolveRiddle(solvedRiddle);
    res.send({correctAnswer: true, points: solvedRiddle.points});
  } else {
    solvedRiddle.skipped = false;
    solvedRiddle.tries++;

    if (riddle.answer.toLowerCase().trim() === answer.toLowerCase().trim()) {
      solvedRiddle.points = _getPoints(riddle, solvedRiddle);
      solvedRiddle.endDate = new Date();
      session.points += solvedRiddle.points;
      await gameService.advanceState(session);
      await _finishSolveRiddle(solvedRiddle);
      res.send({correctAnswer: true, points: session.points});
    } else {
      await _finishSolveRiddle(solvedRiddle);
      res.send({correctAnswer: false, points: session.points});
    }
  }
}

async function _finishSolveRiddle(solvedRiddle) {
  await solvedRiddle.save();
  await scoreBoardService.pushScoreboard();
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
  const token = req.params.token;
  const tagID = req.body.tagID;
  const skip = req.body.skip;
  try {
    res.send(await gameService.checkLocation(token, tagID, skip));
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
    sessions.forEach(async function (session) {
      if (currentTime > session.lastUpdated.getTime() + sessionToDeleteTime) {
        await gameService.deleteSession(session.token);
      }
    });
  });
}

const sessionToDeleteTime = 1000 * 60 * 60 * 24 * 3; //3 Days

setInterval(sessionDeleter, 1000 * 60 * 60);

module.exports = router;
