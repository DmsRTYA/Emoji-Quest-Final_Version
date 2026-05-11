const { WebSocketServer } = require('ws');
console.log("Starting server...");
const wss = new WebSocketServer({ port: 3001 });
wss.on('listening', () => { console.log("Listening on 3001"); });
wss.on('error', (err) => { console.log("Error:", err); });
