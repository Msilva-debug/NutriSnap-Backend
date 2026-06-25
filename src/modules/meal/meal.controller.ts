import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  UseGuards,
  Req,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { MealService } from './meal.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { SaveMealHistoryNoteDto } from './dto/save-meal-history-note.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { MealImageAnalysisService } from './meal-image-analysis.service';
import type { UploadedMealImage } from './meal-image-analysis.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags('comidas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('meal')
export class MealController {
  constructor(
    private readonly mealService: MealService,
    private readonly mealImageAnalysisService: MealImageAnalysisService,
  ) {}

  @Post()
  create(
    @Body() createMealDto: CreateMealDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.mealService.create(createMealDto, request.user.id);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.mealService.findAll(request.user.id);
  }

  @Get('today')
  @ApiOperation({ summary: 'Obtener las comidas del dia de hoy' })
  @ApiResponse({ status: 200, description: 'Listado de comidas de hoy' })
  findToday(@Req() request: AuthenticatedRequest) {
    return this.mealService.findToday(request.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Obtener comidas y nota de una fecha especifica' })
  @ApiQuery({
    name: 'date',
    example: '2026-06-17',
    description: 'Fecha a consultar en formato YYYY-MM-DD',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de comidas y nota diaria de la fecha',
  })
  @ApiResponse({ status: 400, description: 'Fecha invalida' })
  findHistory(
    @Query('date') date: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.mealService.findByDate(request.user.id, date);
  }

  @Patch('history/note')
  @ApiOperation({ summary: 'Guardar la nota de comidas de una fecha' })
  @ApiResponse({ status: 200, description: 'Nota guardada correctamente' })
  @ApiResponse({ status: 400, description: 'Fecha o nota invalida' })
  saveHistoryNote(
    @Body() saveMealHistoryNoteDto: SaveMealHistoryNoteDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.mealService.saveHistoryNote(
      request.user.id,
      saveMealHistoryNoteDto,
    );
  }

  @Post('analyze-image')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({
    summary: 'Analizar una foto de comida y estimar sus nutrientes con IA',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['image'],
    },
  })
  @ApiResponse({ status: 201, description: 'Analisis generado correctamente' })
  @ApiResponse({ status: 400, description: 'Imagen invalida' })
  analyzeImage(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    image: UploadedMealImage,
  ) {
    return this.mealImageAnalysisService.analyze(image);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una comida por ID' })
  @ApiResponse({ status: 200, description: 'Comida encontrada' })
  @ApiResponse({ status: 404, description: 'Comida no encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.mealService.findOne(id, request.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una comida por ID' })
  @ApiResponse({ status: 200, description: 'Comida actualizada correctamente' })
  @ApiResponse({ status: 404, description: 'Comida no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMealDto: UpdateMealDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.mealService.update(id, updateMealDto, request.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una comida por ID' })
  @ApiResponse({ status: 200, description: 'Comida eliminada correctamente' })
  @ApiResponse({ status: 404, description: 'Comida no encontrada' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.mealService.remove(id, request.user.id);
  }
}
