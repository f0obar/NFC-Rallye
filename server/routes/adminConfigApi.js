const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');

const authenticator = require('./authMiddleware');

const Config = require('../models/config');
const Tag = require("../models/tag");

const allowedKeys = {
  get: ['username', 'winText', 'locations'],
  set: ['username', 'winText', 'password', 'locations']
};

const setter = {
  username: setField('username'),
  winText: setField('winText'),
  locations: setField(
    'locations',
    async function (keys) {
      const locations = parseInt(keys.locations, 10);
      if (isNaN(locations)) {
        return 'Location count is not a string'
      }
      const tags = await Tag.find();
      if (locations <= 0) {
        return 'Location count has to be higher than 0'
      }
      if (locations > tags.length) {
        return 'Location count too high'
      }
      return true;
    }
  ),
  password: setField(
    'password',
    function (keys) {
      if (keys.password !== keys.passwordRepeat) {
        return 'Passwords are different';
      }
      return true;
    },
    function (input) {
      return bcrypt.hashSync(input, 10);
    }
  )
};

function setField(field, validator, converter) {
  const isValid = validator || function () {
    return true
  };
  const convert = converter || function (val) {
    return val
  };

  return async function (keys, res) {
    if (!keys[field] || keys[field].length < 1) {
      res.status(400);
      res.send({result: 'No ' + field + ' given.'});
      return;
    }
    const valid = await isValid(keys);
    if (valid !== true) {
      res.status(400);
      res.send({result: valid});
      return;
    }
    try {
      await Config.set(field, convert(keys[field]));
      res.status(200);
      res.send({"changed": true});
    } catch (err) {
      res.status(500);
      res.send(err);
    }
  }
}

router.use(authenticator);

router.put('/:key', function (req, res, next) {
  const key = req.params.key;
  if (allowedKeys.set.indexOf(key) !== -1) {
    const keys = req.body;
    setter[key](keys, res);
  } else {
    res.status(401);
    res.send({result: 'Setting  key "' + key + '" is not allowed'});
  }
});

router.get('/:key', async function (req, res, next) {
  const key = req.params.key;
  if (allowedKeys.get.indexOf(key) !== -1) {
    try {
      const value = await Config.get(key);
      res.send({result: value});
    } catch (err) {
      res.status(500);
      console.error(err);
      res.send({result: 'Internal Server Error'});
    }
  }
});

module.exports = router;