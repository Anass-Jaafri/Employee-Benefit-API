import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateCompanyDto {

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    industry?: string;

    @IsInt()
    @IsOptional()
    @Min(1)
    employeeCount?: number;
}
