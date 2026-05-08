import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Claim } from './claim.entity';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { Employee } from 'src/employees/employee.entity';
import { BenefitPackage } from 'src/benefit-packages/benefit-package.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Claim, Employee, BenefitPackage]),
  ],
  controllers: [ClaimsController],
  providers: [ClaimsService],
})
export class ClaimsModule { }