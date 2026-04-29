import { Injectable,NotFoundException } from '@nestjs/common';

export interface Company {
  id: number;
  name: string;
  industry: string;
  employeeCount: number;
}

@Injectable()
export class CompaniesService {
    
  private companies: Company[] = [
    { id: 1, name: 'Acme Corp', industry: 'Tech', employeeCount: 120 },
    { id: 2, name: 'Flow ESN', industry: 'Consulting', employeeCount: 45 },
  ];
   private nextId = 3;

  findAll(): Company[] {
    return this.companies;
  }

  findOne(id: number): Company {
    const companies = this.companies.find(c => c.id === id);
        
        if(!companies) throw new NotFoundException('Company Not Found');
        return companies;
  }

  createCompany(company: { name: string; industry: string; employeeCount: number}){
    const newCompany = {id: this.nextId++,...company};
    this.companies.push(newCompany);
    return newCompany;
  }

  updateCompany(id: number,data: {name?: string; industry?: string; employeeCount?: number}){

    const company = this.companies.find(c=>c.id===id);
    if(!company) throw new NotFoundException('Company not found');
    Object.assign(company,data);
    return company;
  }

  removeCompany(id:number){
    const index = this.companies.findIndex(c=>c.id===id);
    if(index===-1) throw new NotFoundException('Company not found');
    this.companies.splice(index,1);
    return{message: 'Company deleted successfully'};
  }
}