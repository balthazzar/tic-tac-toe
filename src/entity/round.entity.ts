import { Db } from 'mongodb';
import { Field } from '.';
import { MAX_SIZE } from '../constants';
import { GameStatus, Role } from '../enum';
import { ICell, IField, IRound, IPosition } from '../interface';

export class Round implements IRound {
  field: IField;
  status: GameStatus;
  prevMove: Role | undefined;
  winner: Role | undefined;

  constructor(public db: Db, field?: IField) {
    if (!field) {
      const cells: ICell[] = [];
      for (let i = 0; i < MAX_SIZE; i++) {
        for (let j = 0; j < MAX_SIZE; j++) {
          cells.push({
            position: {
              x: i,
              y: j,
            },
          })
        }
      }

      field = new Field(cells);
    }

    this.field = field;
    this.status = GameStatus.CREATED;
  }

  makeMove(role: Role, position: IPosition) {
    this.field.markCell(role, position);
  }

  checkWin(role: Role) {
    const isWin = this.field.checkStreak(role);
    let isDraw = false;
    
    if (isWin) {
      this.status = GameStatus.ENDED;
      this.winner = role;
    } else {
      let hasEmpty = false;
      for (const cell of this.field.cells) {
        if (!cell.owner) {
          hasEmpty = true;
          break;
        }
      }

      if (!hasEmpty) {
        isDraw = true;
      }

      if (isDraw) {
        this.status = GameStatus.ENDED;
      }
    }

    if (isDraw || isWin) {
      this.db.collection('rounds').insertOne({
        field: this.field,
        winner: this.winner,
        status: this.status,
      });
    }
  }
}