import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
