import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ClaimStatus } from '../claim.entity';
import { StripHtml } from 'src/common/decorators/strip-html.decorator';

export class ReviewClaimDto {
    @IsEnum(ClaimStatus)
    status: ClaimStatus;

    @IsOptional()
    @StripHtml()
    @IsString()
    rejectionReason?: string;
}