const PlaySession = require("../models/playSession");
const WebSocketService = require("./webSocketService");

async function getScoreboard() {
  const result = { sessions: [] };
  const playSessions = await PlaySession.find().exec();
  playSessions.forEach(function(playSession) {
    const session = {};
    session.name = playSession.groupName;
    session.points = playSession.points;
    result.sessions.push(session);
  });
  return result;
}

async function pushScoreboard() {
  try {
    const scoreboard = await getScoreboard();
    WebSocketService.push(scoreboard);
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  getScoreboard,
  pushScoreboard
};
