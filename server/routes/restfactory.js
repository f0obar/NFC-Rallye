// TODO: Improve errormessages: hide the real messages, write a errorhandler, ...

const express = require("express");
const authenticator = require("./authMiddleware");
const SolvedRiddle = require("../models/solvedRiddle");
const scoreBoardService = require("../services/scoreboardService");
const gameService = require("../services/gameService");

const bcrypt = require("bcryptjs");

function getEntries(Model) {
  return function(req, res, next) {
    Model.find(function(err, entries) {
      if (err) {
        res.send(err);
        return;
      }
      res.send(entries);
    });
  };
}

function getEntry(Model) {
  return function(req, res, next) {
    const id = req.params.id;
    Model.findById(id, function(err, entry) {
      if (err) {
        res.send(err);
        return;
      }
      res.send(entry);
    });
  };
}

function createEntry(Model) {
  return function(req, res, next) {
    const model = new Model();
    Model.schema.eachPath(function(path) {
      if (req.body[path]) {
        model[path] = req.body[path];
      }
    });

    model.save(function(err) {
      if (err) {
        res.send(err);
        return;
      }
      res.send({ message: Model.modelName + " created" });
    });
  };
}

function updateEntry(Model) {
  return async function(req, res, next) {
    console.log("id", req.params);
    console.log("req", req.body);
    const id = req.params.id;

    Model.findById(id, function(err, entry) {
      console.log("entry", entry);
      if (err) {
        res.send(err);
        return;
      }
      Model.schema.eachPath(function(path) {
        if (req.body.hasOwnProperty(path)) {
          if (path === "password") {
            entry["password"] = bcrypt.hashSync(req.body["password"], 10);
          } else {
            entry[path] = req.body[path];
          }
        }
      });
      entry.save(function(err) {
        if (err) {
          res.send(err);
          return;
        }
        res.send({ message: Model.modelName + " updated" });
      });
    });
  };
}

function deleteEntry(Model) {
  return async function(req, res, next) {
    const id = req.params.id;
    if (Model.modelName === "PlaySession") {
      try {
        await gameService.deleteSession(id, true);
      } catch (err) {
        console.error(err);
      }
    }
    try {
      await scoreBoardService.pushScoreboard();
      res.send({ message: Model.modelName + " deleted" });
    } catch (err) {
      res.send(err);
      return;
    }
  };
}

function buildRouter(Model) {
  const router = express.Router();
  router.use(authenticator);
  router
    .route("/")
    .get(getEntries(Model))
    .post(createEntry(Model));
  router
    .route("/:id")
    .get(getEntry(Model))
    .put(updateEntry(Model))
    .delete(deleteEntry(Model));

  return router;
}

module.exports = buildRouter;
