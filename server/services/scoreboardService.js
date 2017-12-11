const WebSocket = require('ws');
const PlaySession = require('../models/playSession');

const wss = new WebSocket.Server({ port: 44527 });
let ws = null;

wss.on('connection', function(_ws) {
  console.log("Connected to WebSocket");
  ws = _ws;
});

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

async function pushScoreboard() {
  if (ws !== null) {
    const scoreboard = await getScoreboard();
    ws.send(JSON.stringify(scoreboard.sessions));
    console.log("Pushed Scoreboard through WebSocket")
  } else {
    console.log("No WebSocket connected")
  }
}

module.exports = {
  getScoreboard,
  pushScoreboard
};