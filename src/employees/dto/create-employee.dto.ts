import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { EmploymentStatus } from "../employee.entity";
import { StripHtml } from "src/common/decorators/strip-html.decorator";
import { NormalizeEmail } from "src/common/decorators/normalize-email.decorator";

export class CreateEmployeeDto {

    @IsString()
    @StripHtml()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @StripHtml()
    @IsNotEmpty()
    lastName: string;

    @IsEmail()
    @NormalizeEmail()
    @IsNotEmpty()
    email: string;


    @IsOptional()
    @StripHtml()
    @IsString()
    jobTitle?: string;

    @IsOptional()
    @IsEnum(EmploymentStatus)
    status?: EmploymentStatus;

    @IsInt()
    companyId: number;
}