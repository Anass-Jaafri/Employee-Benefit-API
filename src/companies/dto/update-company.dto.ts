import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";
import { StripHtml } from "src/common/decorators/strip-html.decorator";

export class UpdateCompanyDto {

    @IsString()
    @StripHtml()
    @IsOptional()
    name?: string;

    @IsString()
    @StripHtml()
    @IsOptional()
    industry?: string;

    @IsInt()
    @StripHtml()
    @IsOptional()
    @Min(1)
    employeeCount?: number;

    @IsOptional() @IsBoolean() isActive?: boolean;
}
