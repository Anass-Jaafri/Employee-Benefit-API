import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { EmploymentStatus } from "../employee.entity";

export class CreateEmployeeDto {

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;


    @IsOptional()
    @IsString()
    jobTitle?: string;

    @IsOptional()
    @IsEnum(EmploymentStatus)
    status?: EmploymentStatus;

    @IsInt()
    companyId: number;
}