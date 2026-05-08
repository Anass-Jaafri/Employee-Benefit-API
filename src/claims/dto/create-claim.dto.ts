import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { ClaimType } from '../claim.entity';

export class CreateClaimDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
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