import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { PerkType } from '../benefit-package.entity';
import { StripHtml } from 'src/common/decorators/strip-html.decorator';

export class UpdateBenefitPackageDto {

    @StripHtml()
    @IsOptional()
    @IsString()
    name?: string;

    @StripHtml()
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
    @StripHtml()
    @IsNumber()
    @Min(0)
    maxBenefitAmount?: number;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}