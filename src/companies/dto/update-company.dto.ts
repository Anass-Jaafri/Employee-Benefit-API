import { IsInt, IsString } from "class-validator";

export class UpdateCompanyDto {

    @IsString()
    name?: string;

    @IsString()
    industry?: string;

    @IsInt()
    employeeCount?: number;
}
