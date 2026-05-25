import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
}
