const express = require("express");
const authenticator = require("./authMiddleware");
const scoreBoardService = require("../services/scoreboardService");
const gameService = require("../services/gameService");

const bcrypt = require("bcryptjs");

function getEntries(Model) {
  return async function (req, res, next) {
    try {
      const entries = await Model.find();
      res.send(entries);
    } catch (err) {
      res.send(err);
    }
  };
}

function getEntry(Model) {
  return async function (req, res, next) {
    const id = req.params.id;
    try {
      const entry = await Model.findById(id);
      res.send(entry);
    } catch (err) {
      res.send(err);
    }
  };
}

function createEntry(Model) {
  return async function (req, res, next) {
    const model = new Model();
    Model.schema.eachPath(function (path) {
      if (req.body[path]) {
        model[path] = req.body[path];
      }
    });

    try {
      await model.save();
      res.send({message: Model.modelName + " created"});
    } catch (err) {
      res.send(err);
    }
  };
}

function updateEntry(Model) {
  return async function (req, res, next) {
    console.log("id", req.params);
    console.log("req", req.body);
    const id = req.params.id;

    try {
      const entry = await Model.findById(id);
      console.log("entry", entry);
      Model.schema.eachPath(function (path) {
        if (req.body.hasOwnProperty(path)) {
          if (path === "password") {
            entry["password"] = bcrypt.hashSync(req.body["password"], 10);
          } else {
            entry[path] = req.body[path];
          }
        }
      });
      try {
        await entry.save();
        res.send({message: Model.modelName + " updated"});
      } catch (err) {
        res.send(err);
      }
    } catch (err) {
      res.send(err);
    }
  };
}

function deleteEntry(Model) {
  return async function (req, res, next) {
    const id = req.params.id;
    try {
      if (Model.modelName === "PlaySession") {
        await gameService.deleteSession(id, true);
      } else {
        await Model.remove({_id: id})
      }
    } catch (err) {
      console.error(err);
    }
    try {
      await scoreBoardService.pushScoreboard();
      res.send({message: Model.modelName + " deleted"});
    } catch (err) {
      res.send(err);
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
