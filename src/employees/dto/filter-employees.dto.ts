import { Type } from "class-transformer";
import { IsOptional, IsInt, IsEnum } from "class-validator";
import { EmploymentStatus } from "../employee.entity";

export class FilterEmployeesDto {
    @IsOptional() @IsInt() @Type(() => Number) companyId?: number;
    @IsOptional() @IsEnum(EmploymentStatus) status?: EmploymentStatus;
}