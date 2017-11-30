const Config = require('../models/config');

async function authenticator(req, res, next) {

  const token = req.headers['x-auth-token'];

  if (!token) {
    res.status(401);
    res.send('No token provided');
    res.end();
    return;
  }

  const dbToken = await Config.get('token');
  console.log("Token:", token, dbToken);
  if (dbToken === token) {
    next()
  } else {
    res.status(401);
    res.send('Wrong token');
    res.end();
  }
}

module.exports = authenticator;