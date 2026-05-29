import type { JwtSignOptions } from '@nestjs/jwt';

const expiresIn = process.env.JWT_EXPIRES_IN ?? '1d';

export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
  expiresIn: expiresIn as JwtSignOptions['expiresIn'],
};
