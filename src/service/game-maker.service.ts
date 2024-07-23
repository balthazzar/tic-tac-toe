import { WebSocket } from 'ws';
import { Bot } from '.';

export const gameMaker = {
  startGame: (serverUrl: string) => {
    const bot1 = new Bot(new WebSocket(serverUrl));
    const bot2 = new Bot(new WebSocket(serverUrl));

    bot1.start();
    bot2.start();
  },
};