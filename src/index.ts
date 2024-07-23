import express from 'express';
import http from 'http';
import WebSocket from 'ws';

import { IGameRoom, IRound } from './interface';
import { onWsConnection } from './service';
import { MongoClient } from 'mongodb';
import { GameStatus } from './enum';

import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app);
const wsServer = new WebSocket.Server({ server });

const unfilledRooms: IGameRoom[] = [];

const client = new MongoClient(process.env.MONGO_URI as string);

const bootstrap = async () => {
  const mongoClient = await client.connect();
  const db = mongoClient.db();

  wsServer.on('connection', onWsConnection.bind(null, db, unfilledRooms));

  app.get('/allRounds', async (req, res) => {
    const rounds = await db.collection('rounds').find<IRound>({
      status: GameStatus.ENDED,
    }).toArray();

    res.json(rounds.map(({ winner, field: { cells } }) => {
      let moves = 0;
      let emptyCells = 0;

      for (const cell of cells) {
        cell.owner ? moves++ : emptyCells++;
      }

      return {
        winner,
        moves,
        emptyCells,
      }
    }));
  });
  
  app.get('/gameResults', async (req, res) => {
    const games = await db.collection('games').find().toArray();

    res.json(games.map(({ winner, wins }) => ({
      winner,
      wins,
    })));
  });
}

bootstrap().then(() => {
  server.listen(PORT, () => {
    console.log(`Server listen on port ${PORT}`);
  });
});

