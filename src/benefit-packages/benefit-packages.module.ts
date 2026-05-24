import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BenefitPackage } from './benefit-package.entity';
import { BenefitPackagesController } from './benefit-packages.controller';
import { BenefitPackagesService } from './benefit-packages.service';
import { CompaniesModule } from 'src/companies/companies.module';
import { Employee } from 'src/employees/employee.entity';
import { EmployeesModule } from 'src/employees/employees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BenefitPackage, Employee]),
    CompaniesModule,
    EmployeesModule,
  ],
  controllers: [BenefitPackagesController],
  providers: [BenefitPackagesService],
  exports: [BenefitPackagesService],
})
export class BenefitPackagesModule { }