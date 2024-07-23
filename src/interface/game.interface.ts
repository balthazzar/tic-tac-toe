import { Db } from "mongodb";
import { Role } from "../enum";
import { IRound } from "./round.interface";

export interface IGame {
  db: Db;
  rounds: IRound[],
  currentRound: IRound,
  checkWin(): Role | void;
}