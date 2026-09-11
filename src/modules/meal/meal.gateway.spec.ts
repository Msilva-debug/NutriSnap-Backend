import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { JwtUserResolver } from '../auth/jwt-user.resolver';
import { Meal } from './entities/meal.entity';
import { MealGateway } from './meal.gateway';

describe('MealGateway', () => {
  interface TestSocket {
    data: { userId?: number };
    disconnect: jest.Mock<void, [boolean?]>;
    handshake: {
      auth: { token?: unknown };
      headers: { authorization?: string };
    };
    join: jest.Mock<Promise<void>, [string]>;
    leave: jest.Mock<Promise<void>, [string]>;
  }

  const jwtService = { verifyAsync: jest.fn() };
  const jwtUserResolver = { resolve: jest.fn() };
  let gateway: MealGateway;

  const buildClient = (
    authToken?: unknown,
    authorization?: string,
  ): TestSocket => ({
    data: {},
    handshake: {
      auth: { token: authToken },
      headers: { authorization },
    },
    join: jest.fn((room: string): Promise<void> => {
      void room;
      return Promise.resolve();
    }),
    leave: jest.fn((room: string): Promise<void> => {
      void room;
      return Promise.resolve();
    }),
    disconnect: jest.fn((close?: boolean): void => {
      void close;
    }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new MealGateway(
      jwtService as unknown as JwtService,
      jwtUserResolver as unknown as JwtUserResolver,
    );
  });

  it('authenticates with the handshake token and joins the user room', async () => {
    const client = buildClient(' socket-token ');
    const payload = { sub: 12, email: 'socket@example.com' };
    jwtService.verifyAsync.mockResolvedValue(payload);
    jwtUserResolver.resolve.mockResolvedValue({ id: 12 });

    await gateway.handleConnection(client as unknown as Socket);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('socket-token');
    expect(jwtUserResolver.resolve).toHaveBeenCalledWith(payload);
    expect(client.data.userId).toBe(12);
    expect(client.join).toHaveBeenCalledWith('user:12');
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it.each([
    ['Bearer header-token', 'header-token'],
    [' Bearer   header-token ', 'header-token'],
    ['raw-token', 'raw-token'],
    [' raw-token ', 'raw-token'],
  ])('accepts authorization header %p', async (header, token) => {
    const client = buildClient(undefined, header);
    jwtService.verifyAsync.mockResolvedValue({ sub: 3 });
    jwtUserResolver.resolve.mockResolvedValue({ id: 3 });

    await gateway.handleConnection(client as unknown as Socket);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith(token);
    expect(client.join).toHaveBeenCalledWith('user:3');
  });

  it.each([
    ['without token', buildClient()],
    ['with blank authorization header', buildClient(undefined, '   ')],
    ['with invalid token', buildClient('invalid')],
  ])('disconnects a client %s', async (_case, client) => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await gateway.handleConnection(client as unknown as Socket);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(client.join).not.toHaveBeenCalled();
  });

  it('leaves the user room only for an authenticated client', () => {
    const authenticatedClient = buildClient();
    authenticatedClient.data.userId = 9;
    gateway.handleDisconnect(authenticatedClient as unknown as Socket);
    expect(authenticatedClient.leave).toHaveBeenCalledWith('user:9');

    const anonymousClient = buildClient();
    gateway.handleDisconnect(anonymousClient as unknown as Socket);
    expect(anonymousClient.leave).not.toHaveBeenCalled();
  });

  it('emits new meals only to the owner room', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    Object.assign(gateway, { server: { to } as unknown as Server });
    const meal = { id: 44 } as Meal;

    gateway.emitMealCreated(9, meal);

    expect(to).toHaveBeenCalledWith('user:9');
    expect(emit).toHaveBeenCalledWith('meal:created', meal);
  });

  it('does not fail when the socket server is not initialized', () => {
    expect(() => gateway.emitMealCreated(9, { id: 44 } as Meal)).not.toThrow();
  });
});
