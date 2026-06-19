import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserThemeColorsDto } from './dto/update-user-theme-colors.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags('usuarios')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado correctamente' })
  @ApiResponse({ status: 400, description: 'Cuerpo de solicitud invalido' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('exists-email')
  @ApiOperation({
    summary: 'Validar si un correo electronico ya esta registrado',
  })
  @ApiQuery({
    name: 'email',
    example: 'john@example.com',
    description: 'Correo electronico a validar',
  })
  @ApiResponse({ status: 200, description: 'Correo electronico disponible' })
  @ApiResponse({ status: 400, description: 'Correo electronico ya registrado' })
  validarCorreo(@Query('email') email: string) {
    return this.usersService.validateEmail(email);
  }

  @Patch('theme-colors')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar los colores del tema del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Colores del usuario actualizados correctamente',
  })
  @ApiResponse({ status: 401, description: 'Token invalido o no enviado' })
  updateThemeColors(
    @Body() updateUserThemeColorsDto: UpdateUserThemeColorsDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.updateThemeColors(
      request.user.id,
      updateUserThemeColorsDto,
    );
  }

  // @Get()
  // @ApiOperation({ summary: 'Obtener todos los usuarios' })
  // @ApiResponse({ status: 200, description: 'Listado de usuarios' })
  // findAll() {
  //   return this.usersService.findAll();
  // }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un usuario por ID' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado correctamente',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Eliminar un usuario por ID' })
  // @ApiResponse({ status: 200, description: 'Usuario eliminado correctamente' })
  // @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  // remove(@Param('id') id: string) {
  //   return this.usersService.remove(+id);
  // }
}
