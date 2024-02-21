import { writeFile } from "fs/promises";
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Baldoria API')
    .setDescription('Rest Api for Baldoria Corporation.')
    .setVersion('1.0')
    // .addTag('Doc')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  writeFile('swagger-spec.json', JSON.stringify(document, null, 2));
  SwaggerModule.setup('api', app, document);

  await app.listen(5555);
}
bootstrap();
