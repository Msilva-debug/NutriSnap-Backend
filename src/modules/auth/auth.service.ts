import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../user/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtUserResolver } from './jwt-user.resolver';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { verifyPassword } from './password.utils';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly jwtUserResolver: JwtUserResolver,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    const isPasswordValid =
      user && verifyPassword(loginDto.password, user.password);

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Correo o contrasena invalidos');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: this.buildAuthenticatedUser(user),
    };
  }

  async validateToken(authenticationHeader?: string) {
    const token = this.extractToken(authenticationHeader);

    if (!token) {
      throw new UnauthorizedException('Token no enviado');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = await this.jwtUserResolver.resolve(payload);

      return {
        valid: true,
        user,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Token invalido o expirado');
    }
  }

  private extractToken(authenticationHeader?: string): string | undefined {
    if (!authenticationHeader) {
      return undefined;
    }

    const [type, token] = authenticationHeader.split(' ');

    if (type?.toLowerCase() === 'bearer' && token) {
      return token;
    }

    return authenticationHeader;
  }

  private buildAuthenticatedUser(user: User) {
    return {
      primaryColor: user.primaryColor,
      secondaryColor: user.secondaryColor,
    };
  }
}
