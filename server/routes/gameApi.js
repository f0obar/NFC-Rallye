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
function startPlaySession(req, res, next) {
  const handler = new ResponseHandler(res);
  let locationCount = 0;

  Tag.find()
    .populate('location')
    .exec(function (err, tags) {
      if (err) {
        handler.error(err);
        return;
      }

      const activeTags = tags.filter(function (tag) {
        return (tag.location != undefined && tag.location.isActive == true);
      }).filter(uniqueFilter('location'));

      console.log("activeTags", activeTags);

      locationCount = activeTags.length;

      Riddle.find()
        .populate('location')
        .exec(function (err, riddles) {
          if (err) {
            handler.error(err);
            return;
          }

          const nonLocationRiddles = riddles.filter(function (riddle) {
            return ((riddle.location == undefined || riddle.location == null) && riddle.isActive);
          });

          const locationRiddles = riddles.filter(function (riddle) {
            return (riddle.location != undefined && riddle.location.isActive == true && riddle.isActive);
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
            const groupName = req.body.groupName;
            const playSession = new PlaySession();
            playSession.groupName = groupName;
            playSession.startDate = new Date();
            advanceState(playSession, res, function (savedPlaySession) {
              res.send(savedPlaySession._id);
            });
          } else {
            res.status(503);
            res.end();
          }
        });
    });

}

function advanceState(playSession, res, callback) {
  const handler = new ResponseHandler(res);
  playSession.lastUpdated = new Date();
  playSession.task = 'findLocation';

  Tag.find()
    .populate('location')
    .exec(function (err, tags) {
      if (err) {
        handler.error(err);
        return;
      }

      const activeTags = tags.filter(function (tag) {
        return (tag.location != undefined && tag.location.isActive == true);
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
        _finishAdvanceState(playSession, res, callback);
      } else {
        const locations = activeTags.map(function (tag) {
          return tag.location;
        });
        _getLocationID(playSession, locations, function (res) {
          playSession.location = res;
          _finishAdvanceState(playSession, res, callback);
        });
      }
    });
}

function _getLocationID(session, locations, callback) {

  const objLocationsToVisit = locations.filter(function (location) {
    return session.locationsToVisit.indexOf(location._id) !== -1;
  });

  const result = objLocationsToVisit.sort(function () {
    return Math.random();
  }).sort(function (a, b) {
    return a.heat - b.heat;
  })[0];

  session.locationsToVisit.splice(session.locationsToVisit.indexOf(result._id), 1);

  updateHeat(result, 1, function () {
    callback(result._id);
  })
}

function _saveState(playSession, res, callback) {
  playSession.save(function (err, savedPlaySession) {
    if (err) {
      res.send(err);
      return;
    }
    if (callback) {
      callback(savedPlaySession);
    }
  });
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

function _finishAdvanceState(playSession, res, callback) {
  const handler = new ResponseHandler(res);

  if (playSession.task !== 'won') {
    Riddle.find().exec(function (err, riddles) {
      if (err) {

        handler.error(err);
        return;
      }
      if (!riddles || riddles.length === 0) {
        handler.error(new Error('no Riddles in database'));
        return;
      }
      playSession.riddle = _getRiddleID(playSession, riddles);
      const solvedRiddle = new SolvedRiddle();
      solvedRiddle.riddle = playSession.riddle;
      solvedRiddle.tries = 0;
      SolvedRiddle.create(solvedRiddle);

      playSession.solvedRiddles.push(solvedRiddle);
      _saveState(playSession, res, callback);
    });
  } else {
    _saveState(playSession, res, callback);
  }

}

function _getRiddleID(session, riddles) {

  const unusedRiddles = riddles.filter(function (riddle) {
    return session.solvedRiddles.indexOf(riddle._id) === -1;
  });

  const nonLocationRiddles = unusedRiddles.filter(function (riddle) {
    return ((riddle.location == undefined || riddle.location == null) && riddle.isActive);
  });

  const locationRiddles = unusedRiddles.filter(function (riddle) {
    return (riddle.location != undefined && riddle.location.equals(session.location) && riddle.isActive);
  });

  if (locationRiddles.length > 0) {
    return getAndRemoveRandomElement(locationRiddles)._id;
  }
  return getAndRemoveRandomElement(nonLocationRiddles)._id;
}

function deletePlaySession(req, res, next) {
  const id = req.params.sessionid;

  destroySession(id, res);
}

function destroySession(sessionID, res) {
  PlaySession.remove({
    _id: sessionID
  }, function (err, entry) {
    if (err) {
      res.send(err);
      return;
    }
    res.send({deleted: true});
  });
}

async function getState(req, res, next) {
  const handler = ResponseHandler(res);
  const sessionID = req.params.sessionid;

  try {
    const result = await gameService.getGameState(sessionID);
    handler.success(result);
  } catch(err) {
    handler.error(err)
  }
}

// Will return whether the sent solution was right
// TODO: check for gamestate
function solveRiddle(req, res, next) {
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

  PlaySession.findById(sessionID, function (err, session) {
    if (err) {
      res.send(err);
      return;
    }
    if (!session) {
      res.send(new Error('Invalid session'));
      return;
    }
    session.lastUpdated = new Date();
    if (session.task !== 'solveRiddle') {
      res.send(new Error('Not the time to solve riddles.'));
      return;
    }

    Riddle.findById(session.riddle, function (err, riddle) {
      if (err) {
        res.send(err);
        return;
      }
      SolvedRiddle.findById(session.solvedRiddles[session.solvedRiddles.length - 1], function (err, solvedRiddle) {
        if (err) {
          res.send(err);
        }

        if (skip) {
          solvedRiddle.skipped = true;
          solvedRiddle.points = 0;
          advanceState(session, res, function () {
            res.send({correctAnswer: true, points: solvedRiddle.points});
          });
        } else {
          solvedRiddle.skipped = false;
          solvedRiddle.tries++;

          if (riddle.answer.toLowerCase().trim() === answer.toLowerCase().trim()) {
            solvedRiddle.points = _getPoints(riddle, solvedRiddle);
            session.points += solvedRiddle.points;
            advanceState(session, res, function () {
              res.send({correctAnswer: true, points: session.points});
            });
          } else {
            res.send({correctAnswer: false, points: session.points});
          }
        }
        _saveSolvedRiddles(solvedRiddle, res);
        console.log("SolvedRiddle:", solvedRiddle);
      });
    });
  });
}

function _getPoints(riddle, solvedRiddle) {
  if (riddle.choices.length === 0) {
    return SINGLE_ANSWER_POINTS;
  } else {
    return Math.floor(MULTI_ANSWER_POINTS / solvedRiddle.tries);
  }
}

function updateHeat(location, change, callback) {

  if (location.heat + change >= 0) {
    location.heat += change;
    location.save(function (err) {
      if (err) {
        res.send(err);
        return;
      }

      callback();
    });
  } else {
    callback();
  }
}

// Will check if the location is right. if it is, will allow to solve riddle
async function checkLocation(req, res, next) {
  const sessionID = req.params.sessionid;
  const tagID = req.body.tagID;
  try {
    res.send(await gameService.checkLocation(sessionID, tagID));
  } catch (err) {
    res.send(err);
  }
}

//cleanup and stuff
function heatCountdown() {
  Location.find(function (err, locations) {
    if (err) {
      return;
    }
    locations.forEach(function (location) {
      updateHeat(location, -1, function (err) {
        if (err) {
          console.log('ERROR: ' + err);
        }
      });
    });
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