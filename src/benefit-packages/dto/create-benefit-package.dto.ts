import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { PerkType } from '../benefit-package.entity';

export class CreateBenefitPackageDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsArray()
    @IsEnum(PerkType, { each: true })
    perks?: PerkType[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    maxBenefitAmount?: number;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsNotEmpty()
    companyId: number;
}
