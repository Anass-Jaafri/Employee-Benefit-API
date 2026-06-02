import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { TrimStringsPipe } from './common/pipes/trim-string.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security headers ─────────────────────────────────────────────────────
  // Sets: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security,
  //       X-XSS-Protection, Referrer-Policy, Content-Security-Policy, and more.
  app.use(helmet());


  // ── Cookies ───────────────────────────────────────────────────────────────
  app.use(cookieParser());

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  });

  // ── Global validation ─────────────────────────────────────────────────────
  app.useGlobalPipes(new TrimStringsPipe(), new ValidationPipe());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('BenefitFlow API')
    .setDescription('Employee benefits management platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(process.env.PORT ?? 3000);

}
bootstrap();
