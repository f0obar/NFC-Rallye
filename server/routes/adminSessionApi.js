const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const Config = require('../models/config');

router.post('/', createSession);
router.delete('/:token', deleteSession);

async function createSession(req, res, next) {
  console.log(req.body);
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    res.status(401);
    res.end();
    return;
  }

  try {
    const data = await Config.getLoginData();
    console.log(data);
    if (!data.username && !data.password) {
      // empty db, lets fill it
      await Config.set('username', 'admin');
      await Config.set('password', '$2a$10$PmhJPXOKQFCZqvMZKF0Y2.oT1HKg4oSWIEJn4Z4fhqN81xrZVEgDO');
      await createSession(req, res, next);
    } else {
      if (data.username === username && bcrypt.compareSync(password, data.password)) {
        const token = crypto.randomBytes(64).toString('hex');
        await Config.set('token', token);
        res.send({token: token});
      } else {
        res.status(401);
        res.send('Wrong username/password combination');
      }
    }
  } catch (err) {
    res.status(500);
    res.send(err);
  }
}

async function deleteSession(req, res, next) {
  const token = req.params.token;
  if (!token) {
    res.status(401);
    res.send('wrong token');
    return;
  }

  try {
    const dbToken = await Config.get('token');
    if (token === dbToken) {
      await Config.set('token', '');
      res.send('SUCCESS');
    } else {
      res.status(403);
      res.send('wrong token');
    }
  } catch (err) {
    res.status(500);
    res.send(err);
  }
}

module.exports = router;