import { Db } from 'mongodb';
import { IField, IPosition } from '.';
import { GameStatus, Role } from '../enum';

export interface IRound {
  db: Db;
  field: IField;
  status: GameStatus;
  winner: Role | undefined;
  prevMove: Role | undefined;
  makeMove(role: Role, position: IPosition): void;
  checkWin(role: Role): void;
}