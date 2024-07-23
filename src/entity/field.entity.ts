import { MAX_SIZE } from '../constants';
import { Role } from '../enum';
import { IField, ICell, IPosition } from '../interface';
import { FieldMatrix } from '../types';

export class Field implements IField {
  constructor(public cells: ICell[]) {}

  markCell(role: Role, position: IPosition) {
    const cellIndex = this.getCellIndexByPosition(position);

    if (cellIndex !== undefined && !this.cells[cellIndex].owner) {
      this.cells[cellIndex].owner = role;
    } else {
      throw new Error('Invalid move');
    }
  }

  checkStreak(role: Role) {
    const fieldMatrix = this.mapCellsToMatrix();

    fieldMatrix.map(row => console.log(row.map(cell => {
      if (cell === Role.CROSS) {
        return 'X';
      } else if (cell === Role.NOUGHT) {
        return 'O';
      } else {
        return ' ';
      }
    })));
    let isWin = false;

    let isLDiagonal = true;
    let isRDiagonal = true;
  
    for (let i = 0; i < MAX_SIZE; i++) {
      let isRow = true;
      let isCol = true;

      if (isLDiagonal && fieldMatrix[i][i] !== role) {
        isLDiagonal = false;
      }

      if (isRDiagonal && fieldMatrix[i][MAX_SIZE-1-i] !== role) {
        isRDiagonal = false;
      }

      for (let j = 0; j < MAX_SIZE; j++) {
        if (fieldMatrix[i][j] !== role) {
          isRow = false;
        }

        if (fieldMatrix[j][i] !== role) {
          isCol = false;
        }

        if (!isRow && !isCol) {
          break;
        }
      }

      if (isRow || isCol) {
        isWin = true;
        break;
      }
    }

    if (isLDiagonal || isRDiagonal) {
      isWin = true;
    }

    return isWin;
  }

  mapCellsToMatrix() {
    const fieldMatrix: FieldMatrix = [];

    for (const cell of this.cells) {
      if (!fieldMatrix[cell.position.x]) {
        fieldMatrix[cell.position.x] = [];
      }

      fieldMatrix[cell.position.x][cell.position.y] = cell.owner;
    }

    return fieldMatrix;
  }

  private getCellIndexByPosition(position: IPosition) {
    for (let i = 0; i < this.cells.length; i++) {
      if (position.x === this.cells[i].position.x && position.y === this.cells[i].position.y) {
        return i;
      }
    }
  }
}