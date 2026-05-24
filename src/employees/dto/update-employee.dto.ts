import { IsEmail, IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { EmploymentStatus } from "../employee.entity";
import { UserRole } from "src/users/user.entity";

export class UpdateEmployeeDto {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsEmail()
    @IsOptional()
    email?: string;


    @IsOptional()
    @IsString()
    jobTitle?: string;

    @IsOptional()
    @IsEnum(EmploymentStatus)
    status?: EmploymentStatus;

    @IsEnum(UserRole)
    role: UserRole;

    @IsInt()
    @IsOptional()
    companyId?: number;
}