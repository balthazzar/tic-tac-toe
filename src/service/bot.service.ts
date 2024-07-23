import { WebSocket } from 'ws';

import { GameStatus, Role } from "../enum";
import { IField, IPosition } from '../interface';
import { MessageType } from '../enum/message-type.enum';
import { MAX_SIZE } from '../constants';
import { Field } from '../entity';
import { FieldMatrix, PossibleMovesWeightMap } from '../types';

export class Bot {
  role: Role | undefined;

  constructor(public ws: WebSocket) {}

  start() {
    this.ws.on('message', (event) => {
      const message = JSON.parse(event.toString());
      const field = new Field(message.data.game.field.cells);

      switch (message.type) {
        case MessageType.INIT: {
          this.role = message.data.role;

          if (message.data.game.status === GameStatus.IN_PROGRESS) {
            this.makeMove(field, this.role === Role.CROSS);
          }

          break;
        }
        case MessageType.STATE: {
          if (this.role && message.data.game.prevMove !== this.role) {
            this.makeMove(field, this.role === Role.CROSS);
          }

          break;
        }
      }
    });
  }

  private makeMove(field: IField, isRandom?: boolean) {
    let position: IPosition | undefined;
    if (isRandom) {
      position = {
        x: Math.round(Math.random() * 100 % 2),
        y: Math.round(Math.random() * 100 % 2),
      };
    } else {
      const fieldMatrix = field.mapCellsToMatrix();
    
      position = this.findPossibleMove(fieldMatrix, 2)?.position
        || this.findPossibleMove(fieldMatrix, 2, true)?.position
        || this.select1StreakMove(fieldMatrix)?.position
        || this.findPossibleMove(fieldMatrix, 0)?.position
        || (() => {
          for (let i = 0; i < MAX_SIZE; i++) {
            for (let j = 0; j < MAX_SIZE; j++) {
              if (!fieldMatrix[i][j]) {
                return {
                  x: i,
                  y: j,
                };
              }
            }
          }
      })();
    }

    this.ws.send(JSON.stringify({
      type: MessageType.MOVE,
      data: {
        position,
      },
    }));
  }

  private findPossibleMove(fieldMatrix: FieldMatrix, streakSize: number, forEnemy?: boolean) {
    let possibleMovesWeightMap: PossibleMovesWeightMap = {};

    for (let i = 0; i < MAX_SIZE; i++) {
      this.checkStreak(fieldMatrix, possibleMovesWeightMap, { forEnemy, streakSize, index: i });
      this.checkStreak(fieldMatrix, possibleMovesWeightMap, { forEnemy, streakSize, index: i, isReversed: true });
    }

    this.checkStreak(fieldMatrix, possibleMovesWeightMap, { forEnemy, streakSize });
    this.checkStreak(fieldMatrix, possibleMovesWeightMap, { forEnemy, streakSize, isReversed: true });

    const keys = Object.keys(possibleMovesWeightMap);
    let maxKey: string = keys[0];

    for (const key of keys) {
      if (possibleMovesWeightMap[key].weight > possibleMovesWeightMap[maxKey].weight) {
        maxKey = key;
      }
    }

    return possibleMovesWeightMap[maxKey];
  }

  private checkStreak(fieldMatrix: FieldMatrix, possibleMovesWeightMap: PossibleMovesWeightMap, options: {
    forEnemy: boolean | undefined,
    streakSize: number,
    index?: number,
    isReversed?: boolean,
  }) {
    const { forEnemy, streakSize, index, isReversed } = options;
    const possibleMoves = [];
    let markedCells = 0;

    for (let i = 0; i < MAX_SIZE; i++) {
      let x: number;
      let y: number;

      if (index !== undefined) {
        x = isReversed ? i : index;
        y = isReversed ? index : i;
      } else {
        x = isReversed ? MAX_SIZE - i - 1 : i;
        y = i;
      }
      const check = forEnemy ? (fieldMatrix[x][y] && (fieldMatrix[x][y] !== this.role)) : fieldMatrix[x][y] === this.role;

      if (check) {
        markedCells++;
      } else if (!fieldMatrix[x][y]) {
        possibleMoves.push({
          x,
          y,
        });
      } else {
        return;
      }
    }

    if (possibleMoves.length && markedCells === streakSize) {
      for (const possibleMove of possibleMoves) {
        if (possibleMovesWeightMap[`${possibleMove.x}${possibleMove.y}`]) {
          possibleMovesWeightMap[`${possibleMove.x}${possibleMove.y}`].weight++;
        } else {
          possibleMovesWeightMap[`${possibleMove.x}${possibleMove.y}`] = {
            position: possibleMove,
            weight: 1
          }
        }
      }
    }
  }

  private select1StreakMove(fieldMatrix: FieldMatrix) {
    const own = this.findPossibleMove(fieldMatrix, 1);
    const enemy = this.findPossibleMove(fieldMatrix, 1, true);

    return own?.weight > enemy?.weight ? own : enemy;
  }
}