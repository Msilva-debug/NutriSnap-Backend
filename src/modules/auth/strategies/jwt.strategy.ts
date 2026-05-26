import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../jwt-payload.interface';
import { jwtConstants } from '../jwt.constants';

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
  constructor() {
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
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }
}
