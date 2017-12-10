const express = require('express');
const router = express.Router();

const adminApi = require('./adminApi');
const gameApi = require('./gameApi');
const scoreBoardApi = require('./scoreboardApi');

router.use('/admin', adminApi);
router.use('/game', gameApi);
router.use('/scoreboard', scoreBoardApi);

module.exports = router;
