import { IPosition } from '.';
import { Role } from '../enum';

export interface ICell {
  position: IPosition;
  owner?: Role | undefined;
}