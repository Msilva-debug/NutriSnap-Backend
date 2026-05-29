import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('autenticacion')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesion y obtener un token JWT' })
  @ApiResponse({ status: 201, description: 'JWT generado correctamente' })
  @ApiResponse({ status: 401, description: 'Correo o contrasena invalidos' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('validate-token')
  @ApiOperation({ summary: 'Validar un token JWT' })
  @ApiHeader({
    name: 'authentication',
    required: true,
    description: 'Token JWT. Puede enviarse como Bearer <token> o token crudo',
  })
  @ApiResponse({ status: 200, description: 'Token valido' })
  @ApiResponse({ status: 401, description: 'Token invalido o expirado' })
  validateToken(@Headers('authentication') authenticationHeader?: string) {
    return this.authService.validateToken(authenticationHeader);
  }
}
