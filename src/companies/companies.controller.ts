import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/user.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { EmployeesService } from 'src/employees/employees.service';


@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('companies')
export class CompaniesController {

    constructor(
        private readonly companiesService: CompaniesService,

    ) { }

    @ApiOperation({ summary: 'Get all companies' })
    @Get()
    getCompanies() {
        return this.companiesService.findAll();
    }

    @ApiOperation({ summary: 'Get all deactivated companies' })
    @Roles(UserRole.ADMIN)
    @Get('deleted')
    getDeletedCompanies() {
        return this.companiesService.findDeleted();
    }



    @ApiOperation({ summary: 'Get a company by id' })
    @Get(':id')
    getCompaniesById(@Param('id', ParseIntPipe) id: number) {
        return this.companiesService.findOne(id);
    }

    @ApiOperation({ summary: 'Create a company' })
    @Roles(UserRole.ADMIN)
    @Post()
    createCompany(@Body() body: CreateCompanyDto) {
        return this.companiesService.createCompany(body);
    }



    @ApiOperation({ summary: 'Restore a deactivated company' })
    @Roles(UserRole.ADMIN)
    @Patch(':id/restore')
    restoreCompany(@Param('id', ParseIntPipe) id: number) {
        return this.companiesService.restoreCompany(id);
    }

    @ApiOperation({ summary: 'Update company details' })
    @Roles(UserRole.ADMIN)
    @Patch(':id')
    updateCompany(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateCompanyDto) {

        return this.companiesService.updateCompany(id, body);

    }

    @ApiOperation({ summary: 'Delete company' })
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    deleteCompany(@Param('id', ParseIntPipe) id: number) {
        return this.companiesService.removeCompany(id);
    }
}
