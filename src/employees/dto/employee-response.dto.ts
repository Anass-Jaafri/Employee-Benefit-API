import { Expose, Type } from 'class-transformer';
import { CompanyResponseDto } from '../../companies/dto/company-response.dto';
import { EmploymentStatus } from '../employee.entity';
import { UserRole } from 'src/users/user.entity';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

export class EmployeeResponseDto {
    @Expose() id: number;
    @Expose() firstName: string;
    @Expose() lastName: string;
    @Expose() email: string;
    @Expose() jobTitle: string | null;
    @Expose() status: EmploymentStatus;
    @Expose() createdAt: Date;
    @Expose()
    @Type(() => UserResponseDto)
    user: UserResponseDto;
    @Expose()
    @Type(() => CompanyResponseDto)
    company: CompanyResponseDto;
}