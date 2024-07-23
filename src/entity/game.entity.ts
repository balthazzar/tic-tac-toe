import { Db } from 'mongodb';
import { Role } from '../enum';
import { IGame, IRound } from '../interface';
import { Round } from './round.entity';
import { WIN_ROUNDS_COUNT } from '../constants';

export class Game implements IGame {
  rounds: IRound[] = [];
  currentRound: IRound;

  constructor(public db: Db) {
    this.currentRound = new Round(db);
  }

  checkWin() {
    const roundsWinStat: { [key in Role]: number } = {
      [Role.CROSS]: 0,
      [Role.NOUGHT]: 0,
    };

    for (const round of this.rounds) {
      if (round.winner) {
        roundsWinStat[round.winner]++;
      }
    }

    for (const key of Object.keys(roundsWinStat) as Role[]) {
      if (roundsWinStat[key] === WIN_ROUNDS_COUNT) {
        this.db.collection('games').insertOne({
          rounds: this.rounds.length,
          winner: key,
          wins: roundsWinStat[key],
        });

        return key;
      }
    }
  }
}