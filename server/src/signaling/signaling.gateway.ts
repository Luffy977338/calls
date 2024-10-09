import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { validate, version } from 'uuid';

const ACTIONS = {
  JOIN: 'join',
  LEAVE: 'leave',
  SHARE_ROOMS: 'share-rooms',
  ADD_PEER: 'add-peer',
  REMOVE_PEER: 'remove-peer',
  RELAY_SDP: 'relay-sdp',
  RELAY_ICE: 'relay-ice',
  ICE_CANDIDATE: 'ice-candidate',
  SESSION_DESCRIPTION: 'session-description',
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class VideoGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log('WebSocket сервер запущен');
  }

  getClientRooms() {
    const { rooms } = this.server.sockets.adapter;

    return Array.from(rooms.keys()).filter(
      (roomID) => validate(roomID) && version(roomID) === 4,
    );
  }

  shareRoomsInfo() {
    this.server.emit(ACTIONS.SHARE_ROOMS, {
      rooms: this.getClientRooms(),
    });
  }

  leaveRoom(socket: Socket) {
    const { rooms } = socket;

    console.log(Array.from(rooms));

    Array.from(rooms)
      // LEAVE ONLY CLIENT CREATED ROOM
      .filter((roomID) => validate(roomID) && version(roomID) === 4)
      .forEach((roomID) => {
        const clients = Array.from(
          this.server.sockets.adapter.rooms.get(roomID) || [],
        );

        clients.forEach((clientID) => {
          this.server.to(clientID).emit(ACTIONS.REMOVE_PEER, {
            peerID: socket.id,
          });

          socket.emit(ACTIONS.REMOVE_PEER, {
            peerID: clientID,
          });
        });

        socket.leave(roomID);
      });

    this.shareRoomsInfo();
  }

  handleConnection(client: Socket) {
    console.log(`Клиент подключен: ${client.id}`);
    this.shareRoomsInfo();

    client.on('disconnecting', () => this.handleDisconnecting(client));
  }

  @SubscribeMessage(ACTIONS.JOIN)
  handleJoin(socket: Socket, config: { room: string }) {
    const { room: roomID } = config;
    const { rooms: joinedRooms } = socket;

    if (Array.from(joinedRooms).includes(roomID)) {
      return console.warn(`Already joined to ${roomID}`);
    }

    const clients = Array.from(
      this.server.sockets.adapter.rooms.get(roomID) || [],
    );

    clients.forEach((clientID) => {
      this.server.to(clientID).emit(ACTIONS.ADD_PEER, {
        peerID: socket.id,
        createOffer: false,
      });

      socket.emit(ACTIONS.ADD_PEER, {
        peerID: clientID,
        createOffer: true,
      });
    });

    socket.join(roomID);
    this.shareRoomsInfo();
  }

  @SubscribeMessage(ACTIONS.LEAVE)
  handleLeave(socket: Socket) {
    this.leaveRoom(socket);
  }

  @SubscribeMessage(ACTIONS.RELAY_SDP)
  handleRelaySDP(
    socket: Socket,
    data: { peerID: string; sessionDescription: RTCSessionDescription },
  ) {
    this.server.to(data.peerID).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerID: socket.id,
      sessionDescription: data.sessionDescription,
    });
  }

  @SubscribeMessage(ACTIONS.RELAY_ICE)
  handleRelayICE(
    socket: Socket,
    data: { peerID: string; iceCandidate: RTCIceCandidate },
  ) {
    this.server.to(data.peerID).emit(ACTIONS.ICE_CANDIDATE, {
      peerID: socket.id,
      iceCandidate: data.iceCandidate,
    });
  }

  handleDisconnect(socket: Socket) {
    console.log('disconnect', socket.id);
  }

  handleDisconnecting(socket: Socket) {
    this.leaveRoom(socket);
  }
}
