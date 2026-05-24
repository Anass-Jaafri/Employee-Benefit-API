import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { EmployeesService } from './employees.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/user.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { FilterEmployeesDto } from './dto/filter-employees.dto';
import { CompaniesService } from 'src/companies/companies.service';
import { UpdateCompanyDto } from 'src/companies/dto/update-company.dto';

@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('employees')
export class EmployeesController {
    constructor(private employeesService: EmployeesService,
        private companiesService: CompaniesService
    ) { }

    @ApiOperation({ summary: 'Get all employees' })
    @Get()
    getEmployees(@Query() filters: FilterEmployeesDto) {
        return this.employeesService.findAll(filters);
    }

    @Get('my-employees')
    @Roles(UserRole.HR_MANAGER)
    @ApiOperation({ summary: 'Get all employees in the HR manager company' })
    async findMyCompanyEmployees(@CurrentUser() user: { id: number }) {
        const company = await this.employeesService.findCompanyByUserId(user.id);
        return this.employeesService.findByCompany(company.id);
    }

    @Get('my-company')
    @Roles(UserRole.HR_MANAGER)
    @ApiOperation({ summary: 'Get the HR manager own company' })
    async findMyCompany(@CurrentUser() user: { id: number }) {
        const company = await this.employeesService.findCompanyByUserId(user.id);
        return this.companiesService.findOne(company.id);
    }

    @ApiOperation({ summary: 'Get employee by id' })
    @Get(':id')
    getEmployeeById(@Param('id', ParseIntPipe) id: number) {

        return this.employeesService.findOne(id);
    }

    @ApiOperation({ summary: 'Create employee' })
    @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
    @Post()
    createEmployee(@Body() data: CreateEmployeeDto) {
        return this.employeesService.createEmployee(data);
    }

    @Patch('my-company')
    @Roles(UserRole.HR_MANAGER)
    @ApiOperation({ summary: 'Update the HR manager own company' })
    async updateMyCompany(
        @CurrentUser() user: { id: number },
        @Body() body: UpdateCompanyDto,
    ) {
        const company = await this.employeesService.findCompanyByUserId(user.id);
        return this.companiesService.updateCompany(company.id, body);
    }

    @ApiOperation({ summary: 'Update employee details' })
    @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
    @Patch(':id')
    updateEmployee(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateEmployeeDto,
    ) {
        return this.employeesService.updateEmployee(id, body);
    }

    @ApiOperation({ summary: 'Delete employee' })
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    removeEmployee(@Param('id', ParseIntPipe) id: number) {
        return this.employeesService.removeEmployee(id);
    }

}
