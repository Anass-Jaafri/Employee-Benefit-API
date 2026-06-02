import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from "class-validator";
import { StripHtml } from "src/common/decorators/strip-html.decorator";

export class CreateCompanyDto {

    @IsString()
    @StripHtml()
    @IsNotEmpty()
    name: string;

    @IsString()
    @StripHtml()
    @IsNotEmpty()
    industry: string;

    @IsOptional()
    @IsString()
    @Matches(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
        message: 'domain must be a bare domain name, e.g. acme.com',
    })
    domain?: string;

    @IsInt()
    @StripHtml()
    @Min(1)
    employeeCount: number;
}
