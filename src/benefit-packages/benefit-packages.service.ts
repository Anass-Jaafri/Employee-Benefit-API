import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BenefitPackage } from './benefit-package.entity';
import { CreateBenefitPackageDto } from './dto/create-benefit-package.dto';
import { UpdateBenefitPackageDto } from './dto/update-benefit-package.dto';
import { CompaniesService } from '../companies/companies.service';
import { Employee } from 'src/employees/employee.entity';
import { BenefitPackageResponseDto } from './dto/benefit-package-response.dto';
import { toDto, toDtoArray } from 'src/common/helpers/serialize';
import { EmployeesService } from 'src/employees/employees.service';
import { paginate, PaginatedResult } from 'src/common/helpers/paginate';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FilterBenefitPackagesDto } from './dto/filter-benefit-packages.dto';

@Injectable()
export class BenefitPackagesService {
  constructor(
    @InjectRepository(BenefitPackage)
    private benefitPackagesRepository: Repository<BenefitPackage>,
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
    private employeesService: EmployeesService,
    private companiesService: CompaniesService,
  ) {}

  async findAll(pagination: PaginationDto, filters: FilterBenefitPackagesDto) {
    const where: FindOptionsWhere<BenefitPackage> = {};
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.companyId !== undefined)
      where.company = { id: filters.companyId };

    const result = await paginate(
      this.benefitPackagesRepository,
      { where, relations: ['company'], order: { createdAt: 'DESC' } },
      pagination.page,
      pagination.limit,
    );
    return {
      items: toDtoArray(BenefitPackageResponseDto, result.items),
      meta: result.meta,
    };
  }

  async findOne(id: number): Promise<BenefitPackageResponseDto> {
    const pkg = await this.benefitPackagesRepository.findOne({
      where: { id },
      relations: ['company'],
    });
    if (!pkg) throw new NotFoundException('Benefit package not found');
    return toDto(BenefitPackageResponseDto, pkg);
  }

  async findMyPackages(userId: number): Promise<BenefitPackageResponseDto[]> {
    const employee = await this.employeesRepository.findOne({
      where: { user: { id: userId } },
      relations: ['benefitPackages', 'benefitPackages.company'],
    });

    if (!employee) throw new NotFoundException('Employee profile not found');

    return toDtoArray(BenefitPackageResponseDto, employee.benefitPackages);
  }

  async findByCompany(companyId: number): Promise<BenefitPackageResponseDto[]> {
    const packages = await this.benefitPackagesRepository.find({
      where: { company: { id: companyId } },
      relations: ['company'],
    });
    return toDtoArray(BenefitPackageResponseDto, packages);
  }

  async createBenefitPackage(
    data: CreateBenefitPackageDto,
  ): Promise<BenefitPackageResponseDto> {
    const company = await this.companiesService.findOneEntity(data.companyId!);
    const pkg = this.benefitPackagesRepository.create({
      ...data,
      company,
    });
    const saved = await this.benefitPackagesRepository.save(pkg);
    const full = await this.benefitPackagesRepository.findOne({
      where: { id: saved.id },
      relations: ['company'],
    });
    return toDto(BenefitPackageResponseDto, full!);
  }

  async createPackageForMyCompany(
    userId: number,
    data: CreateBenefitPackageDto,
  ): Promise<BenefitPackageResponseDto> {
    const company = await this.employeesService.findCompanyByUserId(userId);
    const pkg = this.benefitPackagesRepository.create({ ...data, company });
    const saved = await this.benefitPackagesRepository.save(pkg);
    const full = await this.benefitPackagesRepository.findOne({
      where: { id: saved.id },
      relations: ['company'],
    });
    return toDto(BenefitPackageResponseDto, full!);
  }

  async updateBenefitPackage(
    id: number,
    data: UpdateBenefitPackageDto,
  ): Promise<BenefitPackageResponseDto> {
    const pkg = await this.benefitPackagesRepository.findOneBy({ id });
    if (!pkg) throw new NotFoundException('Package not found');
    Object.assign(pkg, data);
    const saved = await this.benefitPackagesRepository.save(pkg);
    return toDto(BenefitPackageResponseDto, saved);
  }

  async removeBenefitPackage(id: number): Promise<{ message: string }> {
    const pkg = await this.benefitPackagesRepository.findOneBy({ id });
    if (!pkg) throw new NotFoundException('Package not found');
    await this.benefitPackagesRepository.remove(pkg);
    return { message: 'Benefit package removed successfully' };
  }

  async enrollEmployee(
    packageId: number,
    employeeId: number,
  ): Promise<{ message: string }> {
    const pkg = await this.benefitPackagesRepository.findOne({
      where: { id: packageId },
    });
    if (!pkg) throw new NotFoundException('Package not found');
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

  async verifyOwnership(packageId: number, userId: number): Promise<void> {
    const employee = await this.employeesRepository.findOne({
      where: { user: { id: userId } },
      relations: ['company'],
    });
    const pkg = await this.benefitPackagesRepository.findOne({
      where: { id: packageId },
      relations: ['company'],
    });
    if (!pkg) throw new NotFoundException('Package not found');
    if (!employee?.company || pkg.company.id !== employee.company.id) {
      throw new ForbiddenException(
        'You can only manage packages for your own company',
      );
    }
  }
  async verifyEmployeeOwnership(
    employeeId: number,
    userId: number,
  ): Promise<void> {
    const hrCompany = await this.employeesService.findCompanyByUserId(userId);
    const employee = await this.employeesRepository.findOne({
      where: { id: employeeId },
      relations: ['company'],
    });
    if (!employee) throw new NotFoundException('Employee not found');
    if (employee.company?.id !== hrCompany.id) {
      throw new ForbiddenException(
        'You can only enroll employees from your own company',
      );
    }
  }
}
