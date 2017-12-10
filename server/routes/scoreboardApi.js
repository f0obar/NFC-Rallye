const scoreBoardService = require('../services/scoreboardService');
const express = require('express');
const router = express.Router();

router.get('', getScoreboard);

async function getScoreboard(req, res, next) {
  res.send(await scoreBoardService.getScoreboard());
}

module.exports = router;