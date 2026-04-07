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
  // Default Helmet CSP blocks Swagger UI inline scripts; production (HTTPS) enforces it strictly.
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'script-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'https://validator.swagger.io'],
        },
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // swagger setup
  const swaggerOptions = new DocumentBuilder()
    .setTitle(`${appName} api`)
    .setDescription(
      `${appName} API. Call POST /api/auth/login, then send the returned access_token as a Bearer token. Roles: ADMIN, USER.`,
    )
    .setVersion('1.0')
    .addTag(appName)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the value of `access_token` from POST /auth/login',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  if (process.env.NODE_ENV === 'development') {
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = Number.parseInt(process.env.PORT ?? '', 10) || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(
    `Listening on http://0.0.0.0:${port} (Swagger: http://127.0.0.1:${port}/api/docs)`,
  );
}
void bootstrap();
