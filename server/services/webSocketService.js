const WebSocket = require("ws");

const _port = global.ws_port || 44527;

const wss = new WebSocket.Server({ port: _port });

wss.on("connection", function(ws) {
  console.log("Connected to WebSocket Client");
});

async function push(json) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(json));
    }
  });
  console.log("Pushed Scoreboard through WebSocket");
}

module.exports = {
  push
};
