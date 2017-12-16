const WebSocket = require("ws");

let prod = process.env.PROD;

let ws_port = 0;

if (prod === 'true') {
  // Proxy WebSocket through Nginx for SSL Support
  ws_port = 44526
} else {
  ws_port = 44527
}

console.log('WebSocket Port:', ws_port);

const wss = new WebSocket.Server({ port: ws_port });

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
