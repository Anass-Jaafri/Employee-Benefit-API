import { Expose, Type } from 'class-transformer';
import { CompanyResponseDto } from '../../companies/dto/company-response.dto';
import { PerkType } from '../benefit-package.entity';

export class BenefitPackageResponseDto {
    @Expose() id: number;
    @Expose() name: string;
    @Expose() description: string | null;
    @Expose() isActive: boolean;
    @Expose() perks: PerkType[];
    @Expose() maxBenefitAmount: number | null;
    @Expose() startDate: string | null;
    @Expose() endDate: string | null;
    @Expose() createdAt: string;

    @Expose()
    @Type(() => CompanyResponseDto)
    company: CompanyResponseDto;
}