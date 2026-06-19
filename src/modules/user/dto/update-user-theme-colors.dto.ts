import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserThemeColorsDto {
  @ApiProperty({
    example: '#6d28d9',
    description: 'Nuevo color primario del tema del usuario',
  })
  primaryColor: string;

  @ApiProperty({
    example: '#ecfeff',
    description: 'Nuevo color secundario del tema del usuario',
  })
  secondaryColor: string;
}
