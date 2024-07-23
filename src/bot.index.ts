import { gameMaker } from './service';

const PORT = 4001;
const serverUrl = `ws://localhost:${PORT}`;

gameMaker.startGame(serverUrl);