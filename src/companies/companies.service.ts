import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './companies.entity';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { toDto, toDtoArray } from 'src/common/helpers/serialize';



@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private companiesRepository: Repository<Company>,
    private dataSource: DataSource,
  ) { }

  async findAll(): Promise<CompanyResponseDto[]> {
    const companies = await this.companiesRepository.find();
    return toDtoArray(CompanyResponseDto, companies);
  }

  async findOne(id: number): Promise<CompanyResponseDto> {

    const companies = await this.companiesRepository.findOneBy({ id })
    if (!companies) throw new NotFoundException('Company not found');
    return toDto(CompanyResponseDto, companies);
  }

  async findOneEntity(id: number): Promise<Company> {
    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async createCompany(data: CreateCompanyDto): Promise<CompanyResponseDto> {
    const existing = await this.companiesRepository.findOneBy({ name: data.name });
    if (existing) throw new ConflictException('Company already exist');
    const newCompany = this.companiesRepository.create(data);
    const saved = await this.companiesRepository.save(newCompany);

    return toDto(CompanyResponseDto, saved);

  }

  async updateCompany(id: number, data: UpdateCompanyDto): Promise<CompanyResponseDto> {

    const company = await this.companiesRepository.findOneBy({ id })
    if (!company) throw new NotFoundException('Company not found');
    // if deactivating, cascade to benefit packages
    if (data.isActive === false && company.isActive === true) {
      await this.dataSource.query(
        `UPDATE benefit_package SET "isActive" = false WHERE "companyId" = $1`,
        [id],
      );
    }
    Object.assign(company, data);
    const saved = await this.companiesRepository.save(company);

    return toDto(CompanyResponseDto, saved);
  }
  // Soft delete
  async removeCompany(id: number): Promise<{ message: string }> {

    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) throw new NotFoundException('Company not found');
    await this.companiesRepository.softDelete(id);
    return { message: 'Company deleted successfully' };
  }

  //Find all soft deleted
  async findDeleted(): Promise<CompanyResponseDto[]> {

    const deleted = await this.companiesRepository.find({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
    });
    return toDtoArray(CompanyResponseDto, deleted);
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