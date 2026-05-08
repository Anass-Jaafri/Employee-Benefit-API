import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ClaimStatus } from '../claim.entity';

export class ReviewClaimDto {
    @IsEnum(ClaimStatus)
    status: ClaimStatus;

    @IsOptional()
    @IsString()
    rejectionReason?: string;
}