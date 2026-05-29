import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../user/users.service';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtUserResolver {
  constructor(private readonly usersService: UsersService) {}

  async resolve(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('El usuario del token no existe');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
