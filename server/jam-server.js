const { WebSocketServer } = require('ws');
const { logger } = require('./logger');

const wss = new WebSocketServer({ port: 3030 });
const sessions = new Map();
function broadcast(sessionId, msg, except) {
  const peers = sessions.get(sessionId) || [];
  for (const ws of peers) if (ws !== except && ws.readyState === 1) ws.send(msg);
}
wss.on('connection', (ws) => {
  let sessionId = null;

  ws.on('message', (data) => {
    try {
      const { type, id, payload } = JSON.parse(data);

      if (type === 'join') {
        sessionId = id;
        if (!sessions.has(id)) sessions.set(id, []);
        sessions.get(id).push(ws);
        return;
      }

      if (sessionId) {
        broadcast(sessionId, data, ws);
      }
    } catch (err) {
      logger.error(`ws error ${err}`);
    }
  });
  ws.on('close', () => {
    if (sessionId) {
      const arr = sessions.get(sessionId) || [];
      sessions.set(sessionId, arr.filter((p) => p !== ws));
    }
  });
});
logger.info('Jam server running on 3030');
