import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { ClaimType } from '../claim.entity';
import { StripHtml } from 'src/common/decorators/strip-html.decorator';

export class CreateClaimDto {
    @IsString()
    @StripHtml()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @StripHtml()
    @IsString()
    description?: string;

    @IsNumber()
    @StripHtml()
    @Min(0)
    amount: number;

    @IsEnum(ClaimType)
    claimType: ClaimType;

    @IsOptional()
    @IsString()
    attachmentUrl?: string;

    @IsNumber()
    benefitPackageId: number;
}