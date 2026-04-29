import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

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

    @Post()
    createCompany(@Body() body: CreateCompanyDto) {
        return this.companiesservice.createCompany(body);
    }

    @Patch(':id')
    updateCompany(@Param('id') id: string, @Body() body: UpdateCompanyDto) {

        return this.companiesservice.updateCompany(+id, body);

    }

    @Delete(':id')
    deleteCompany(@Param('id') id: string) {

        return this.companiesservice.removeCompany(+id);

    }


}
