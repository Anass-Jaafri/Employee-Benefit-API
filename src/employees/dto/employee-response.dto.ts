import { Expose, Type } from 'class-transformer';
import { CompanyResponseDto } from '../../companies/dto/company-response.dto';
import { EmploymentStatus } from '../employee.entity';

export class EmployeeResponseDto {
    @Expose() id: number;
    @Expose() firstName: string;
    @Expose() lastName: string;
    @Expose() email: string;
    @Expose() jobTitle: string | null;
    @Expose() status: EmploymentStatus;
    @Expose() createdAt: Date;

    @Expose()
    @Type(() => CompanyResponseDto)  // tells class-transformer to recurse into nested objects
    company: CompanyResponseDto;
}