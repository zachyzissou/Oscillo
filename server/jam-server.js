const { WebSocketServer } = require('ws');
const { logger } = require('./logger');

const port = Number(process.env.JAM_SERVER_PORT || 3030);
const allowedOrigins = (process.env.JAM_ALLOWED_ORIGINS || 'http://localhost:3000,https://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const requiredToken = process.env.JAM_SERVER_TOKEN;

const wss = new WebSocketServer({
  port,
  verifyClient({ origin }, done) {
    if (!origin || allowedOrigins.includes('*')) {
      return done(true);
    }
    if (allowedOrigins.includes(origin)) {
      return done(true);
    }
    logger.warn(`Blocked WebSocket connection from origin ${origin}`);
    return done(false, 403, 'Forbidden');
  },
});

const sessions = new Map();

function broadcast(sessionId, msg, except) {
  const peers = sessions.get(sessionId) || [];
  for (const ws of peers) if (ws !== except && ws.readyState === 1) ws.send(msg);
}

wss.on('connection', (ws) => {
  let sessionId = null;
  let authenticated = !requiredToken;

  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw);
      if (message.type === 'join') {
        if (requiredToken && message.token !== requiredToken) {
          ws.send(JSON.stringify({ type: 'error', reason: 'unauthorized' }));
          ws.close(4401, 'Unauthorized');
          return;
        }
        sessionId = message.id;
        authenticated = true;
        if (!sessions.has(sessionId)) sessions.set(sessionId, []);
        sessions.get(sessionId).push(ws);
        return;
      }

      if (!authenticated || !sessionId) {
        ws.send(JSON.stringify({ type: 'error', reason: 'unauthenticated' }));
        return;
      }

      broadcast(sessionId, raw.toString(), ws);
    } catch (err) {
      logger.error(`ws error ${err}`);
    }
  });

  ws.on('close', () => {
    if (sessionId) {
      const peers = sessions.get(sessionId) || [];
      sessions.set(sessionId, peers.filter((peer) => peer !== ws));
    }
  });
});

logger.info(`Jam server running on port ${port}`);
