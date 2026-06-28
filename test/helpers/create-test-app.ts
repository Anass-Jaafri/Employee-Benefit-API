import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
  VERSION_NEUTRAL,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';

// Entities
import { User } from 'src/users/user.entity';
import { Employee } from 'src/employees/employee.entity';
import { Company } from 'src/companies/companies.entity';
import { BenefitPackage } from 'src/benefit-packages/benefit-package.entity';
import { Claim } from 'src/claims/claim.entity';

import { RefreshToken } from 'src/auth/refresh-token.entity';
import { LoginAttempt } from 'src/auth/login-attempt.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { CompaniesModule } from 'src/companies/companies.module';
import { EmployeesModule } from 'src/employees/employees.module';
import { BenefitPackagesModule } from 'src/benefit-packages/benefit-packages.module';
import { ClaimsModule } from 'src/claims/claims.module';
import { HealthModule } from 'src/health/health.module';

// Global providers
import { CustomThrottlerGuard } from 'src/common/guards/custom-throttler.guard';
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptor';
import { TrimStringsPipe } from 'src/common/pipes/trim-string.pipe';

// ── SQLite compatibility patch ────────────────────────────────────────────────
import { patchEntitiesForSqlite } from './sqlite-column-patcher';
patchEntitiesForSqlite();

/**
 * Bootstraps a real NestJS application backed by an in-memory SQLite database.
 */
export async function createTestApp(): Promise<{
  app: INestApplication;
  dataSource: DataSource;
}> {
  // Minimum env vars — bypass Joi by not passing validationSchema to ConfigModule
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'e2e-test-jwt-secret-must-be-32chars!!';
  process.env.JWT_REFRESH_SECRET = 'e2e-test-refresh-secret-32chars!!x';
  process.env.FRONTEND_URL = 'http://localhost:4200';
  // Dummy DB vars — satisfied by the SQLite override below
  process.env.DB_HOST = 'localhost';
  process.env.DB_USERNAME = 'test';
  process.env.DB_PASSWORD = 'test';
  process.env.DB_NAME = 'test';

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: ':memory:',
        entities: [
          User,
          Employee,
          Company,
          BenefitPackage,
          Claim,
          RefreshToken,
          LoginAttempt,
        ],
        synchronize: true,
        dropSchema: true,
      }),

      ThrottlerModule.forRoot([{ name: 'global', ttl: 60_000, limit: 60 }]),

      // All feature modules — same set as AppModule
      AuthModule,
      UsersModule,
      CompaniesModule,
      EmployeesModule,
      BenefitPackagesModule,
      ClaimsModule,
      HealthModule,
    ],
    providers: [{ provide: APP_GUARD, useClass: CustomThrottlerGuard }],
  }).compile();

  const app = moduleRef.createNestApplication();

  // Mirror main.ts bootstrap exactly
  // Must match main.ts — controllers use version: '1' so /v1/ prefix is required
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new TrimStringsPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  await app.init();

  const dataSource = moduleRef.get<DataSource>(getDataSourceToken());
  return { app, dataSource };
}
