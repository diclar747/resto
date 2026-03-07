import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const expressApp = express();
let isBootstrapped = false;

async function bootstrap() {
  if (isBootstrapped) return;

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.init();
  isBootstrapped = true;
}

export default async function handler(req: any, res: any) {
  await bootstrap();
  expressApp(req, res);
}
