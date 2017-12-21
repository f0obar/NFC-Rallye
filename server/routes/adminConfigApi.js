const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const authenticator = require('./authMiddleware');
const Config = require('../models/config');

const allowedKeys = {
  get: ['username', 'winText'],
  set: ['username', 'winText', 'password']
};

const setter = {
  username: setField('username'),
  winText: setField('winText'),
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
      res.status(404);
      res.send('No ' + field + ' given.');
      return;
    }
    const valid = isValid(keys);
    if (valid !== true) {
      res.status(404);
      res.send(valid);
      return;
    }
    try {
      await Config.set(field, convert(keys[field]));
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
    res.send('Setting  key "' + key + '" is not allowed');
  }
});

router.get('/:key', async function (req, res, next) {
  const key = req.params.key;
  if (allowedKeys.get.indexOf(key) !== -1) {
    try {
      const value = await Config.get(key);
      res.send(value);
    } catch (err) {
      res.status(500);
      res.send(err);
    }
  }
});

module.exports = router;