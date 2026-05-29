import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { jwtConstants } from '../jwt.constants';
import { JwtUserResolver } from '../jwt-user.resolver';

function extractJwtFromAuthenticationHeader(request: Request): string | null {
  const authenticationHeader = request.headers.authentication;

  if (!authenticationHeader || Array.isArray(authenticationHeader)) {
    return null;
  }

  const [type, token] = authenticationHeader.split(' ');

  if (type?.toLowerCase() === 'bearer' && token) {
    return token;
  }

  return authenticationHeader;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly jwtUserResolver: JwtUserResolver) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractJwtFromAuthenticationHeader,
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  validate(payload: JwtPayload) {
    return this.jwtUserResolver.resolve(payload);
  }
}
