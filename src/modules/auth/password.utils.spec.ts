import { hashPassword, verifyPassword } from './password.utils';

describe('password utils', () => {
  const password = 'Mateosilva01';
  const legacyScryptPassword =
    'dd14f72ec28814871eaafafd28444f7e:3b95c0d0cfa1aafe16b4ea220dc93a4b4d7fd7d6aa30b80fc70b9dfa60cd8ce74471ef56febd7c66a2ccb5596ede0b324b42efd7c84fd56bd63ce064f8dc45ba';

  it('hashes new passwords with bcrypt', () => {
    const hashedPassword = hashPassword(password);

    expect(hashedPassword).toMatch(/^\$2b\$12\$/);
    expect(verifyPassword(password, hashedPassword)).toBe(true);
    expect(verifyPassword('wrong-password', hashedPassword)).toBe(false);
  });

  it('verifies legacy scrypt passwords', () => {
    expect(verifyPassword(password, legacyScryptPassword)).toBe(true);
    expect(verifyPassword('wrong-password', legacyScryptPassword)).toBe(false);
  });
});
