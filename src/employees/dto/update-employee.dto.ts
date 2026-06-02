import { IsEmail, IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { EmploymentStatus } from "../employee.entity";
import { UserRole } from "src/users/user.entity";
import { StripHtml } from "src/common/decorators/strip-html.decorator";

export class UpdateEmployeeDto {
    @IsString()
    @StripHtml()
    @IsOptional()
    firstName?: string;

    @IsString()
    @StripHtml()
    @IsOptional()
    lastName?: string;

    @IsEmail()
    @IsOptional()
    email?: string;


    @IsOptional()
    @StripHtml()
    @IsString()
    jobTitle?: string;

    @IsOptional()
    @IsEnum(EmploymentStatus)
    status?: EmploymentStatus;

    @IsInt()
    @IsOptional()
    companyId?: number;
}