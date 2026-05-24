import { Expose, Type } from 'class-transformer';
import { CompanyResponseDto } from '../../companies/dto/company-response.dto';
import { UserRole } from '../../users/user.entity';
import { EmploymentStatus } from '../../employees/employee.entity';

export class ProfileResponseDto {
    @Expose() id: number;
    @Expose() email: string;
    @Expose() role: UserRole;
    @Expose() firstName: string;
    @Expose() lastName: string;
    @Expose() jobTitle: string | null;
    @Expose() status: EmploymentStatus;

    @Expose()
    @Type(() => CompanyResponseDto)
    company: CompanyResponseDto | null;
}