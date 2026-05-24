import { Expose, Type } from 'class-transformer';
import { EmployeeResponseDto } from '../../employees/dto/employee-response.dto';
import { BenefitPackageResponseDto } from '../../benefit-packages/dto/benefit-package-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { ClaimStatus, ClaimType } from '../claim.entity';

export class ClaimResponseDto {
    @Expose() id: number;
    @Expose() title: string;
    @Expose() description: string | null;
    @Expose() amount: number;
    @Expose() status: ClaimStatus;
    @Expose() claimType: ClaimType;
    @Expose() attachmentUrl: string | null;
    @Expose() rejectionReason: string | null;
    @Expose() reviewedAt: Date | null;
    @Expose() createdAt: Date;
    @Expose() updatedAt: Date;

    @Expose()
    @Type(() => EmployeeResponseDto)
    employee: EmployeeResponseDto;

    @Expose()
    @Type(() => BenefitPackageResponseDto)
    benefitPackage: BenefitPackageResponseDto;

    @Expose()
    @Type(() => UserResponseDto)
    reviewedBy: UserResponseDto | null;
}