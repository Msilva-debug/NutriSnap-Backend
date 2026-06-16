import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JwtUserResolver } from '../auth/jwt-user.resolver';
import { Meal } from './entities/meal.entity';

@Injectable()
@WebSocketGateway({
  namespace: '/meals',
  cors: {
    origin: [
      'http://localhost:4200',
      'http://127.0.0.1:4200',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://f006-161-18-228-190.ngrok-free.app',
    ],
    credentials: true,
  },
})
export class MealGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server?: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly jwtUserResolver: JwtUserResolver,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new UnauthorizedException('Token no enviado');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = await this.jwtUserResolver.resolve(payload);
      const room = this.getUserRoom(user.id);

      client.data.userId = user.id;
      await client.join(room);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data.userId;

    if (typeof userId === 'number') {
      void client.leave(this.getUserRoom(userId));
    }
  }

  emitMealCreated(userId: number, meal: Meal): void {
    this.server?.to(this.getUserRoom(userId)).emit('meal:created', meal);
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken;
    }

    const authorizationHeader = client.handshake.headers.authorization;

    if (!authorizationHeader) {
      return undefined;
    }

    const [type, token] = authorizationHeader.split(' ');

    if (type?.toLowerCase() === 'bearer' && token) {
      return token;
    }

    return authorizationHeader;
  }

  private getUserRoom(userId: number): string {
    return `user:${userId}`;
  }
}
