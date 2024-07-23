import { ICell, IPosition } from '.';
import { Role } from '../enum';

export interface IField {
  cells: ICell[];
  markCell(role: Role, position: IPosition): void;
  checkStreak(role: Role): boolean;
  mapCellsToMatrix(): (Role | undefined)[][];
}