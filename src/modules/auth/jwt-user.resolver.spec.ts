import { UsersService } from '../user/users.service';
import { JwtUserResolver } from './jwt-user.resolver';

describe('JwtUserResolver', () => {
  const usersService = {
    findById: jest.fn(),
  };
  const resolver = new JwtUserResolver(usersService as unknown as UsersService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves the public authenticated user fields', async () => {
    usersService.findById.mockResolvedValue({
      id: 4,
      email: 'jwt@example.com',
      name: 'JWT User',
      password: 'must-not-leak',
      primaryColor: '#111111',
      secondaryColor: '#eeeeee',
    });

    await expect(
      resolver.resolve({ sub: 4, email: 'jwt@example.com', name: 'JWT User' }),
    ).resolves.toEqual({
      id: 4,
      email: 'jwt@example.com',
      name: 'JWT User',
      primaryColor: '#111111',
      secondaryColor: '#eeeeee',
    });
    expect(usersService.findById).toHaveBeenCalledWith(4);
  });

  it('rejects a token whose user no longer exists', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      resolver.resolve({
        sub: 404,
        email: 'missing@example.com',
        name: 'Missing',
      }),
    ).rejects.toThrow('El usuario del token no existe');
  });
});
