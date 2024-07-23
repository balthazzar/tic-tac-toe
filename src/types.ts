import { Role } from "./enum";
import { IPosition } from "./interface"

export type PossibleMovesWeightMap = {
  [key: string]: { position: IPosition, weight: number }
}

export type FieldMatrix = (Role | undefined)[][];