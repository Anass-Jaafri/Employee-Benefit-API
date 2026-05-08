import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BenefitPackage } from './benefit-package.entity';
import { CreateBenefitPackageDto } from './dto/create-benefit-package.dto';
import { UpdateBenefitPackageDto } from './dto/update-benefit-package.dto';
import { CompaniesService } from '../companies/companies.service';
import { Employee } from 'src/employees/employee.entity';

@Injectable()
export class BenefitPackagesService {
    constructor(

        @InjectRepository(BenefitPackage)
        private benefitPackagesRepository: Repository<BenefitPackage>,
        @InjectRepository(Employee)
        private employeesRepository: Repository<Employee>,
        private companiesService: CompaniesService,
    ) { }

    findAll(): Promise<BenefitPackage[]> {
        return this.benefitPackagesRepository.find({
            relations: ['company'],
        });
    }

    async findOne(id: number): Promise<BenefitPackage> {
        const pkg = await this.benefitPackagesRepository.findOne({
            where: { id },
            relations: ['company', 'employees'],
        });
        if (!pkg) throw new NotFoundException('Benefit package not found');
        return pkg;
    }

    async createBenefitPackage(
        data: CreateBenefitPackageDto,
    ): Promise<BenefitPackage> {
        const company = await this.companiesService.findOne(data.companyId);
        const pkg = this.benefitPackagesRepository.create({
            ...data,
            company,
        });
        return this.benefitPackagesRepository.save(pkg);
    }

    async updateBenefitPackage(
        id: number,
        data: UpdateBenefitPackageDto,
    ): Promise<BenefitPackage> {
        const pkg = await this.findOne(id);
        Object.assign(pkg, data);
        return this.benefitPackagesRepository.save(pkg);
    }

    async removeBenefitPackage(id: number): Promise<{ message: string }> {
        const pkg = await this.findOne(id);
        await this.benefitPackagesRepository.remove(pkg);
        return { message: 'Benefit package removed successfully' };
    }


    async enrollEmployee(
        packageId: number,
        employeeId: number,
    ): Promise<{ message: string }> {
        const pkg = await this.findOne(packageId);
        const employee = await this.employeesRepository.findOne({
            where: { id: employeeId },
            relations: ['benefitPackages'],
        });
        if (!employee) throw new NotFoundException('Employee not found');

        const alreadyEnrolled = employee.benefitPackages.some(
            (p) => p.id === packageId,
        );
        if (alreadyEnrolled)
            throw new ConflictException('Employee already enrolled in this package');

        employee.benefitPackages = [...employee.benefitPackages, pkg];
        await this.employeesRepository.save(employee);
        return { message: 'Employee enrolled successfully' };
    }
}
