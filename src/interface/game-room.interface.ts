import WebSocket from 'ws';

import { Role } from '../enum';
import { IGame } from './game.interface';

export interface IGameRoom {
  game: IGame;
  players: {
    [key in Role]?: WebSocket;
  };
}