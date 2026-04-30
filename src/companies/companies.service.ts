import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './companies.entity';
import { Repository } from 'typeorm';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';



@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private companiesRepository: Repository<Company>,
  ) { }

  findAll(): Promise<Company[]> {
    return this.companiesRepository.find();
  }

  async findOne(id: number): Promise<Company> {

    const companies = await this.companiesRepository.findOneBy({ id })
    if (!companies) throw new NotFoundException('Company not found');
    return companies;
  }

  createCompany(data: CreateCompanyDto): Promise<Company> {
    const newCompany = this.companiesRepository.create(data);
    return this.companiesRepository.save(newCompany);
  }

  async updateCompany(id: number, data: UpdateCompanyDto): Promise<Company> {

    const company = await this.companiesRepository.findOneBy({ id })
    if (!company) throw new NotFoundException('Company not found');
    Object.assign(company, data);

    return this.companiesRepository.save(company);
  }

  async removeCompany(id: number): Promise<{ message: string }> {

    await this.companiesRepository.delete(id);
    return { message: 'Company deleted successfully' };

  }
}