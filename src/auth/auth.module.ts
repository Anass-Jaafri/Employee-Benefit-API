import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './auth.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from 'src/employees/employee.entity';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { Company } from 'src/companies/companies.entity';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { User } from 'src/users/user.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Employee, Company, User]), UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, JwtRefreshGuard],
  controllers: [AuthController],
})
export class AuthModule { }
