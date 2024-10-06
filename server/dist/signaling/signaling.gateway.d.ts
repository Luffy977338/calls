import { Server } from 'socket.io';
export declare class SignalingGateway {
    server: Server;
    handleOffer(data: any): void;
    handleAnswer(data: any): void;
    handleCandidate(data: any): void;
}
