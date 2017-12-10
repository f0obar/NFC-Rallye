const PlaySession = require('../models/playSession');

async function getScoreboard() {
  const result = {sessions: []};
  const playSessions = await PlaySession.find().exec();
  playSessions.forEach(function(playSession) {
    const session = {};
    session.name = playSession.groupName;
    session.points = playSession.points;
    result.sessions.push(session);
  });
  return result;
}

module.exports = {
  getScoreboard
};