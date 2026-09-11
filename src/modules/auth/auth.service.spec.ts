import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../user/users.service';
import { User } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { JwtUserResolver } from './jwt-user.resolver';
import { hashPassword } from './password.utils';

describe('AuthService', () => {
  const usersService = {
    findByEmail: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const jwtUserResolver = {
    resolve: jest.fn(),
  };
  const storedPassword = hashPassword('correct-password');
  const storedUser = {
    id: 7,
    email: 'user@example.com',
    name: 'Nutri User',
    password: storedPassword,
    primaryColor: '#112233',
    secondaryColor: '#abcdef',
  } as User;
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      jwtUserResolver as unknown as JwtUserResolver,
    );
  });

  describe('login', () => {
    it('signs a token and returns only the authenticated user fields', async () => {
      usersService.findByEmail.mockResolvedValue(storedUser);
      jwtService.signAsync.mockResolvedValue('signed-token');

      await expect(
        service.login({
          email: storedUser.email,
          password: 'correct-password',
        }),
      ).resolves.toEqual({
        access_token: 'signed-token',
        user: {
          primaryColor: '#112233',
          secondaryColor: '#abcdef',
        },
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: storedUser.id,
        email: storedUser.email,
        name: storedUser.name,
      });
    });

    it('rejects an unknown email without signing a token', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'missing@example.com', password: 'anything' }),
      ).rejects.toThrow('Correo o contrasena invalidos');
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('rejects an invalid password without signing a token', async () => {
      usersService.findByEmail.mockResolvedValue(storedUser);

      await expect(
        service.login({ email: storedUser.email, password: 'wrong-password' }),
      ).rejects.toThrow('Correo o contrasena invalidos');
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('validateToken', () => {
    it.each([undefined, '', '   '])(
      'rejects a missing authentication header (%p)',
      async (header) => {
        await expect(service.validateToken(header)).rejects.toThrow(
          'Token invalido o expirado',
        );
        expect(jwtService.verifyAsync).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['Bearer signed-token', 'signed-token'],
      ['bearer signed-token', 'signed-token'],
      [' Bearer   signed-token ', 'signed-token'],
      ['signed-token', 'signed-token'],
      [' signed-token ', 'signed-token'],
    ])('validates header %s using token %s', async (header, token) => {
      const payload = {
        sub: storedUser.id,
        email: storedUser.email,
        name: storedUser.name,
      };
      const authenticatedUser = {
        id: storedUser.id,
        email: storedUser.email,
        name: storedUser.name,
        primaryColor: storedUser.primaryColor,
        secondaryColor: storedUser.secondaryColor,
      };

      jwtService.verifyAsync.mockResolvedValue(payload);
      jwtUserResolver.resolve.mockResolvedValue(authenticatedUser);

      await expect(service.validateToken(header)).resolves.toEqual({
        valid: true,
        user: authenticatedUser,
      });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token);
      expect(jwtUserResolver.resolve).toHaveBeenCalledWith(payload);
    });

    it('maps JWT verification failures to an unauthorized error', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('expired'));

      await expect(service.validateToken('expired-token')).rejects.toThrow(
        'Token invalido o expirado',
      );
    });

    it('preserves unauthorized errors from the user resolver', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 99 });
      jwtUserResolver.resolve.mockRejectedValue(
        new UnauthorizedException('El usuario del token no existe'),
      );

      await expect(service.validateToken('signed-token')).rejects.toThrow(
        'El usuario del token no existe',
      );
    });
  });
});
