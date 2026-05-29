process.stdout.write('=== OPERAFLOW PROCESS STARTED ===\n');

process.on('uncaughtException', (err) => {
  process.stdout.write(`UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  process.stdout.write(`UNHANDLED REJECTION: ${String(reason)}\n`);
  process.exit(1);
});

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

process.stdout.write('=== IMPORTS OK ===\n');

async function bootstrap() {
  process.stdout.write('=== BOOTSTRAP STARTED ===\n');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({ origin: process.env.FRONTEND_URL || '*' });

  const config = new DocumentBuilder()
    .setTitle('OperaFlow API')
    .setDescription('Plataforma Inteligente de Gestão Operacional Industrial')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`OperaFlow Backend rodando em: http://0.0.0.0:${port}/api`);
  console.log(`Swagger em: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  process.stdout.write(`FATAL BOOTSTRAP ERROR: ${err?.message}\n${err?.stack}\n`);
  process.exit(1);
});
