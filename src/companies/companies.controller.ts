import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/user.entity';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('companies')
export class CompaniesController {
    constructor(private readonly companiesservice: CompaniesService) { }

    @Get()
    getCompanies() {
        return this.companiesservice.findAll();
    }

    @Get(':id')
    getCompaniesById(@Param('id') id: string) {
        return this.companiesservice.findOne(+id);
    }


    @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
    @Post()
    createCompany(@Body() body: CreateCompanyDto) {
        return this.companiesservice.createCompany(body);
    }

    @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
    @Patch(':id')
    updateCompany(@Param('id') id: string, @Body() body: UpdateCompanyDto) {

        return this.companiesservice.updateCompany(+id, body);

    }

    @Roles(UserRole.ADMIN)
    @Delete(':id')
    deleteCompany(@Param('id') id: string) {

        return this.companiesservice.removeCompany(+id);

    }


}
