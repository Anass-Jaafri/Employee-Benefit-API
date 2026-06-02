import { IsOptional, IsBoolean, IsInt } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FilterBenefitPackagesDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  companyId?: number;
}
