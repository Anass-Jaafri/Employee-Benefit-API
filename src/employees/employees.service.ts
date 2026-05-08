import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { Repository } from 'typeorm';
import { CompaniesService } from 'src/companies/companies.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
    constructor(
        @InjectRepository(Employee)
        private employeesRepository: Repository<Employee>,
        private companiesService: CompaniesService,
    ) { }

    findAll(): Promise<Employee[]> {

        return this.employeesRepository.find({ relations: ['company'] });
    }

    async findOne(id: number): Promise<Employee> {
        const employee = await this.employeesRepository.findOne({
            where: { id },
            relations: ['company'],
        });

        if (!employee) throw new NotFoundException('Employee not found');
        return employee;
    }

    async createEmployee(data: CreateEmployeeDto): Promise<Employee> {
        const company = await this.companiesService.findOne(data.companyId);

        const employee = this.employeesRepository.create({
            ...data,
            company,
        });

        return this.employeesRepository.save(employee);
    }

    async updateEmployee(id: number, data: UpdateEmployeeDto): Promise<Employee> {
        const employee = await this.findOne(id);

        if (data.companyId) {
            employee.company = await this.companiesService.findOne(data.companyId);
        }

        Object.assign(employee, data);
        return this.employeesRepository.save(employee);
    }

    async removeEmployee(id: number): Promise<{ message: string }> {
        const employee = await this.findOne(id);
        await this.employeesRepository.softDelete(employee.id);
        return { message: 'Employee deactivated successfully' };
    }
}
