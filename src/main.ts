import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsOrigins = (
    configService.get<string>('CORS_ORIGINS') ?? 'http://localhost:4200'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  const config = new DocumentBuilder()
    .setTitle('NutriSnap API')
    .setDescription('Documentacion de la API de NutriSnap Backend')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('autenticacion')
    .addTag('usuarios')
    .addTag('comidas')
    .addTag('planes nutricionales')
    .addTag('niveles de actividad')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(Number(configService.get<string>('PORT', '8080')));
}
void bootstrap();
