import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { CompaniesService } from 'src/companies/companies.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { toDto, toDtoArray } from 'src/common/helpers/serialize';
import { Company } from 'src/companies/companies.entity';
import { FilterEmployeesDto } from './dto/filter-employees.dto';
import { User, UserRole } from 'src/users/user.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { paginate, PaginatedResult } from 'src/common/helpers/paginate';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private companiesService: CompaniesService,
  ) {}

  async findAll(pagination: PaginationDto, filters: FilterEmployeesDto) {
    if (filters.search) {
      const term = `%${filters.search}%`;
      const [items, total] = await this.employeesRepository
        .createQueryBuilder('e')
        .leftJoinAndSelect('e.company', 'company')
        .leftJoinAndSelect('e.user', 'user')
        .where(filters.companyId ? 'e.companyId = :companyId' : '1=1', {
          companyId: filters.companyId,
        })
        .andWhere(filters.status ? 'e.status = :status' : '1=1', {
          status: filters.status,
        })
        .andWhere(
          '(LOWER(e.firstName) LIKE LOWER(:term) OR LOWER(e.lastName) LIKE LOWER(:term) OR LOWER(e.email) LIKE LOWER(:term))',
          { term },
        )
        .skip((pagination.page! - 1) * pagination.limit!)
        .take(pagination.limit)
        .getManyAndCount();

      return {
        items: toDtoArray(EmployeeResponseDto, items),
        meta: {
          total,
          page: pagination.page!,
          limit: pagination.limit!,
          totalPages: Math.ceil(total / pagination.limit!),
        },
      };
    }

    // No search — use the simpler paginate() helper
    const where: FindOptionsWhere<Employee> = {};
    if (filters.companyId) where.company = { id: filters.companyId };
    if (filters.status) where.status = filters.status;

    const result = await paginate(
      this.employeesRepository,
      { where, relations: ['company', 'user'] },
      pagination.page,
      pagination.limit,
    );
    return {
      items: toDtoArray(EmployeeResponseDto, result.items),
      meta: result.meta,
    };
  }

  async findOne(id: number): Promise<EmployeeResponseDto> {
    const employee = await this.employeesRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!employee) throw new NotFoundException('Employee not found');
    return toDto(EmployeeResponseDto, employee);
  }

  async findOneEntity(id: number): Promise<Employee> {
    const employee = await this.employeesRepository.findOneBy({ id });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
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
      relations: ['company', 'user'],
    });
    return toDtoArray(EmployeeResponseDto, employees);
  }

  async findUnassigned(): Promise<EmployeeResponseDto[]> {
    const employees = await this.employeesRepository.find({
      where: { company: IsNull() },
      relations: ['user'],
    });
    return toDtoArray(EmployeeResponseDto, employees);
  }

  async createEmployee(data: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    const company = await this.companiesService.findOneEntity(data.companyId);

    const employee = this.employeesRepository.create({
      ...data,
      company,
    });
    const saved = await this.employeesRepository.save(employee);
    return toDto(EmployeeResponseDto, saved);
  }

  async updateEmployee(
    id: number,
    data: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeesRepository.findOneBy({ id });
    if (!employee) throw new NotFoundException('Employee not found');

    if (data.companyId) {
      employee.company = await this.companiesService.findOneEntity(
        data.companyId,
      );
    }

    Object.assign(employee, data);
    const saved = await this.employeesRepository.save(employee);
    return toDto(EmployeeResponseDto, saved);
  }

  async updateRole(employeeId: number, role: UserRole, hrUserId: number) {
    if (role === UserRole.ADMIN) {
      throw new ForbiddenException('HR managers cannot assign the admin role');
    }
    // Resolve HR's company ───────────────────────────────────────────
    const hrCompany = await this.findCompanyByUserId(hrUserId);

    // Load target employee with company and user ─────────────────────
    const employee = await this.employeesRepository.findOne({
      where: { id: employeeId },
      relations: ['company', 'user'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Company scoping check ──────────────────────────────────────────
    // HR manager can only change roles within their own company.
    if (employee.company?.id !== hrCompany.id) {
      throw new ForbiddenException(
        'You can only manage employees in your own company',
      );
    }

    // Prevent self-demotion ──────────────────────────────────────────
    // An HR manager demoting themselves would lock them out of this endpoint.
    if (employee.user.id === hrUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    // Update the role on the User record ─────────────────────────────
    // Role lives on User, not Employee — Employee is only used for scoping.
    await this.usersRepository.update(employee.user.id, { role });

    const updated = await this.employeesRepository.findOne({
      where: { id: employeeId },
      relations: ['company', 'user'],
    });

    return toDto(EmployeeResponseDto, updated!);
  }

  async removeEmployee(id: number): Promise<{ message: string }> {
    const employee = await this.findOne(id);
    await this.employeesRepository.softDelete(employee.id);
    return { message: 'Employee deactivated successfully' };
  }

  async assignCompany(
    employeeId: number,
    companyId: number,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeesRepository.findOne({
      where: { id: employeeId },
      relations: ['user', 'company'],
    });
    if (!employee) throw new NotFoundException('Employee not found');

    // TypeORM accepts a partial relation object — no need to load the full Company.
    employee.company = { id: companyId } as any;
    const saved = await this.employeesRepository.save(employee);

    // Reload to get the full company relation for the response DTO.
    const reloaded = await this.employeesRepository.findOne({
      where: { id: saved.id },
      relations: ['user', 'company'],
    });
    return toDtoArray(EmployeeResponseDto, [reloaded!])[0];
  }
}
