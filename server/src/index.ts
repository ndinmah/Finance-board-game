import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebopolyRoom } from './rooms/WebopolyRoom';
import { LobbyRoom } from './rooms/LobbyRoom';

const PORT = Number(process.env.PORT) || 2567;

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const httpServer = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define('lobby', LobbyRoom);
gameServer.define('webopoly', WebopolyRoom, {
  filterBy: ['roomCode'],
});

gameServer.listen(PORT).then(() => {
  console.log(`🎲 Webopoly server running on ws://localhost:${PORT}`);
  console.log(`   HTTP API at http://localhost:${PORT}`);
});
