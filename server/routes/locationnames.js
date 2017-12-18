const express = require("express");
const authenticator = require("./authMiddleware");
const Location = require("../models/location");

const router = express.Router();
router.use(authenticator);

router.get('/', async function(req, res, next) {
  const result = {locations: {}};
  try {
    const locations = await Location.find().exec();
    locations.forEach(function (location) {
      result.locations[location._id] = location.name;
    });
    res.send(result);
  } catch(err) {
    res.status(500);
    res.send(err);
  }
});

module.exports = router;
