import { gameMaker } from './service';

import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT;
const serverUrl = `${process.env.WS_URL}:${PORT}`;

gameMaker.startGame(serverUrl);