
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const appName = process.env.APP_NAME || 'backend_task_management_system';

  app.setGlobalPrefix('api');
  app.enableCors();
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // swagger setup
  const swaggerOptions = new DocumentBuilder()
    .setTitle(`${appName} api`)
    .setDescription(`${appName} api docs`)
    .setVersion('1.0')
    .addTag(appName)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number.parseInt(process.env.PORT ?? '', 10) || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(
    `Listening on http://0.0.0.0:${port} (Swagger: http://127.0.0.1:${port}/api/docs)`,
  );
}
void bootstrap();
