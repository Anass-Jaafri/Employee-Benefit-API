import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CompaniesService } from 'src/companies/companies.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { toDto, toDtoArray } from 'src/common/helpers/serialize';
import { Company } from 'src/companies/companies.entity';
import { FilterEmployeesDto } from './dto/filter-employees.dto';

@Injectable()
export class EmployeesService {
    constructor(
        @InjectRepository(Employee)
        private employeesRepository: Repository<Employee>,
        private companiesService: CompaniesService,
    ) { }

    async findAll(filters: FilterEmployeesDto): Promise<EmployeeResponseDto[]> {
        const where: FindOptionsWhere<Employee> = {};

        if (filters.companyId) where.company = { id: filters.companyId };
        if (filters.status) where.status = filters.status;

        const employees = await this.employeesRepository.find({
            where,
            relations: ['company'],
        });

        return toDtoArray(EmployeeResponseDto, employees);
    }

    async findOne(id: number): Promise<EmployeeResponseDto> {
        const employee = await this.employeesRepository.findOne({
            where: { id },
            relations: ['company'],
        });

        if (!employee) throw new NotFoundException('Employee not found');
        return toDto(EmployeeResponseDto, employee);
    }

    async findCompanyByUserId(userId: number): Promise<Company> {
        const employee = await this.employeesRepository.findOne({
            where: { user: { id: userId } },
            relations: ['company'],
        });

        if (!employee?.company) {
            throw new NotFoundException('No company associated with this account');
        }

        return employee.company;
    }

    async findByCompany(companyId: number): Promise<EmployeeResponseDto[]> {
        const employees = await this.employeesRepository.find({
            where: { company: { id: companyId } },
            relations: ['company'],
        });
        return toDtoArray(EmployeeResponseDto, employees);
    }

    async createEmployee(data: CreateEmployeeDto): Promise<EmployeeResponseDto> {
        const company = await this.companiesService.findOne(data.companyId);

        const employee = this.employeesRepository.create({
            ...data,
            company,
        });
        const saved = await this.employeesRepository.save(employee)
        return toDto(EmployeeResponseDto, saved);
    }

    async updateEmployee(id: number, data: UpdateEmployeeDto): Promise<EmployeeResponseDto> {
        const employee = await this.employeesRepository.findOneBy({ id });
        if (!employee) throw new NotFoundException('Employee not found');

        if (data.companyId) {
            employee.company = await this.companiesService.findOneEntity(data.companyId);
        }

        Object.assign(employee, data);
        const saved = await this.employeesRepository.save(employee)
        return toDto(EmployeeResponseDto, saved);
    }

    async removeEmployee(id: number): Promise<{ message: string }> {
        const employee = await this.findOne(id);
        await this.employeesRepository.softDelete(employee.id);
        return { message: 'Employee deactivated successfully' };
    }
}
