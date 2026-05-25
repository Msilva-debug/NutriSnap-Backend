import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Correo electronico del usuario',
  })
  email: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Contrasena del usuario',
  })
  password: string;
}
