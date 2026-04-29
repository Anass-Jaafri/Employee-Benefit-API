import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class CreateCompanyDto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    industry: string;

    @IsInt()
    @Min(1)
    employeeCount: number;
}
