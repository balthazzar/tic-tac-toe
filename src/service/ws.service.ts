import WebSocket from 'ws';
import { Db } from 'mongodb';

import { Round } from '../entity';
import { Game } from '../entity/game.entity';
import { Role, GameStatus } from '../enum';
import { MessageType } from '../enum/message-type.enum';
import { IGameRoom, IPosition } from '../interface';

export const onWsConnection = (db: Db, unfilledRooms: IGameRoom[], ws: WebSocket) => {
  let room = unfilledRooms.shift();
  let currentRole: Role;

  if (room) {
    currentRole = Role.CROSS;
    
    room.game.currentRound.status = GameStatus.IN_PROGRESS;
    room.players[Role.CROSS] = ws;
  } else {
    currentRole = Role.NOUGHT;

    room = {
      game: new Game(db),
      players: { [Role.NOUGHT]: ws },
    }

    unfilledRooms.push(room);
  }

  ws.on('message', wsOnMessage.bind(null, db, room, currentRole, ws));

  const { field, prevMove, status } = room.game.currentRound;

  ws.send(JSON.stringify({
    type: MessageType.INIT,
    data: {
      role: currentRole,
      game: {
        field,
        prevMove,
        status,
      },
    },
  }));
};

const wsOnMessage = (db: Db, room: IGameRoom, currentRole: Role, ws: WebSocket, event: WebSocket.MessageEvent) => {
  const message = JSON.parse(event.toString());
  console.log('---------------')

  if (message.type === MessageType.MOVE && room.game.currentRound.prevMove !== currentRole) {
    const position: IPosition = message.data.position;

    try {
      room.game.currentRound.makeMove(currentRole, position);
      room.game.currentRound.checkWin(currentRole);

      room.game.currentRound.prevMove = currentRole;

      if (room.game.currentRound.status === GameStatus.ENDED) {
        console.log(`winner: ${room.game.currentRound.winner || 'DRAW'}`);

        room.game.rounds.push(room.game.currentRound);
        
        const winner = room.game.checkWin();

        if (winner) {
          console.log(`Game winner: ${winner}`);

          for (const player of Object.values(room.players)) {
            player.close();
          }
        }

        room.game.currentRound = new Round(db);
        room.game.currentRound.status = GameStatus.IN_PROGRESS;

        // const tossCoin = Math.round(Math.random());
        for (const player of Object.values(room.players)) {
          // currentRole = tossCoin ? Role.CROSS : Role.NOUGHT;

          const { field, prevMove, status } = room.game.currentRound;

          player.send(JSON.stringify({
            type: MessageType.STATE,
            data: {
              game: {
                field,
                prevMove,
                status,
              },
            },
          }));
        }
      } else {
        const anotherPlayer = currentRole === Role.CROSS ? Role.NOUGHT : Role.CROSS;
        const { field, prevMove, status } = room.game.currentRound;

        room.players[anotherPlayer]?.send(JSON.stringify({
          type: MessageType.STATE,
          data: {
            game: {
              field,
              prevMove,
              status,
            },
          },
        }));
      }
    } catch (err) {
      const { field, prevMove, status } = room.game.currentRound;

      ws.send(JSON.stringify({
        type: MessageType.STATE,
        data: {
          err, 
          game: {
            field,
            prevMove,
            status,
          },
        },
      }));
    }
  }
}