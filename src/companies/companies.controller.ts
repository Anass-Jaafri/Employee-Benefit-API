import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/user.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';


@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('companies')
export class CompaniesController {
    constructor(private readonly companiesservice: CompaniesService) { }

    @ApiOperation({ summary: 'Get all companies' })
    @Get()
    getCompanies() {
        return this.companiesservice.findAll();
    }

    @ApiOperation({ summary: 'Get all deactivated companies' })
    @Roles(UserRole.ADMIN)
    @Get('deleted')
    getDeletedCompanies() {
        return this.companiesservice.findDeleted();
    }

    @ApiOperation({ summary: 'Get a company by id' })
    @Get(':id')
    getCompaniesById(@Param('id', ParseIntPipe) id: number) {
        return this.companiesservice.findOne(id);
    }

    @ApiOperation({ summary: 'Create a company' })
    @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
    @Post()
    createCompany(@Body() body: CreateCompanyDto) {
        return this.companiesservice.createCompany(body);
    }

    @ApiOperation({ summary: 'Restore a deactivated company' })
    @Roles(UserRole.ADMIN)
    @Patch(':id/restore')
    restoreCompany(@Param('id', ParseIntPipe) id: number) {
        return this.companiesservice.restoreCompany(id);
    }

    @ApiOperation({ summary: 'Update company details' })
    @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
    @Patch(':id')
    updateCompany(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateCompanyDto) {

        return this.companiesservice.updateCompany(id, body);

    }

    @ApiOperation({ summary: 'Delete company' })
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    deleteCompany(@Param('id', ParseIntPipe) id: number) {
        return this.companiesservice.removeCompany(id);
    }




}
