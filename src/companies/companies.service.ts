import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './companies.entity';
import { IsNull, Not, Repository } from 'typeorm';
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

  async createCompany(data: CreateCompanyDto): Promise<Company> {
    const existing = await this.companiesRepository.findOneBy({ name: data.name });
    if (existing) throw new ConflictException('Company already exist');

    const newCompany = this.companiesRepository.create(data);

    return this.companiesRepository.save(newCompany);

  }

  async updateCompany(id: number, data: UpdateCompanyDto): Promise<Company> {

    const company = await this.companiesRepository.findOneBy({ id })
    if (!company) throw new NotFoundException('Company not found');
    Object.assign(company, data);

    return this.companiesRepository.save(company);
  }
  // Soft delete
  async removeCompany(id: number): Promise<{ message: string }> {

    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) throw new NotFoundException('Company not found');
    await this.companiesRepository.softDelete(id);
    return { message: 'Company deleted successfully' };
  }

  //Find all soft deleted
  findDeleted(): Promise<Company[]> {
    return this.companiesRepository.find({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
    });
  }

  //restore a soft deleted company
  async restoreCompany(id: number): Promise<{ message: string }> {
    const company = await this.companiesRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!company) throw new NotFoundException('Company not found');
    await this.companiesRepository.restore(id);
    return { message: 'Company restored successfully' };
  }
}