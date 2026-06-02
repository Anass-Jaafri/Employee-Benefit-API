import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/users/user.entity';
import { BenefitPackagesService } from './benefit-packages.service';
import { CreateBenefitPackageDto } from './dto/create-benefit-package.dto';
import { UpdateBenefitPackageDto } from './dto/update-benefit-package.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { EmployeesService } from 'src/employees/employees.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FilterClaimsDto } from 'src/claims/dto/filter-claims.dto';
import { FilterBenefitPackagesDto } from './dto/filter-benefit-packages.dto';

@ApiTags('benefit-packages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('benefit-packages')
export class BenefitPackagesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private benefitPackagesService: BenefitPackagesService,
  ) {}

  @ApiOperation({ summary: 'Get all benefit packages' })
  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query() filters: FilterBenefitPackagesDto,
  ) {
    return this.benefitPackagesService.findAll(pagination, filters);
  }

  @Get('my-benefit')
  @Roles(UserRole.EMPLOYEE, UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Get benefit packages enrolled by the logged-in employee',
  })
  findMyPackages(@CurrentUser() user: { id: number }) {
    return this.benefitPackagesService.findMyPackages(user.id);
  }

  @Get('my-company-benefit')
  @Roles(UserRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Get all benefit packages for the HR manager company',
  })
  async findMyCompanyPackages(@CurrentUser() user: { id: number }) {
    const company = await this.employeesService.findCompanyByUserId(user.id);
    return this.benefitPackagesService.findByCompany(company.id);
  }

  @ApiOperation({ summary: 'Get benefit package by id' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.benefitPackagesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a benefit package for my company' })
  @Post('my-company')
  @Roles(UserRole.HR_MANAGER)
  createForMyCompany(
    @Body() dto: CreateBenefitPackageDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.benefitPackagesService.createPackageForMyCompany(user.id, dto);
  }

  @ApiOperation({ summary: 'Create a benefit package by Admin' })
  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateBenefitPackageDto, @CurrentUser() user: any) {
    if (user.role === UserRole.HR_MANAGER) {
      const company = await this.employeesService.findCompanyByUserId(user.id);
      dto.companyId = company.id;
    }
    return this.benefitPackagesService.createBenefitPackage(dto);
  }

  @ApiOperation({ summary: 'Enroll an employee in a benefit package' })
  @Post(':id/enroll/:employeeId')
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
  async enrollEmployee(
    @Param('id', ParseIntPipe) packageId: number,
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    if (user.role === UserRole.HR_MANAGER) {
      await this.benefitPackagesService.verifyOwnership(packageId, user.id);
      // Also verify employee belongs to HR's company
      await this.benefitPackagesService.verifyEmployeeOwnership(
        employeeId,
        user.id,
      );
    }
    return this.benefitPackagesService.enrollEmployee(packageId, employeeId);
  }

  @ApiOperation({ summary: 'Update a benefit package' })
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @Patch(':id')
  async updateBenefitPackage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBenefitPackageDto,
    @CurrentUser() user: { id: number; role: UserRole },
  ) {
    if (user.role === UserRole.HR_MANAGER) {
      await this.benefitPackagesService.verifyOwnership(id, user.id);
    }
    return this.benefitPackagesService.updateBenefitPackage(id, dto);
  }

  @ApiOperation({ summary: 'Remove a benefit package' })
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  removeBenefitPackage(@Param('id', ParseIntPipe) id: number) {
    return this.benefitPackagesService.removeBenefitPackage(id);
  }
}
