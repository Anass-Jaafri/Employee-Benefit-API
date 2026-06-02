import { IsOptional, IsString, IsNotEmpty, IsEmail } from "class-validator";
import { NormalizeEmail } from "src/common/decorators/normalize-email.decorator";
import { StripHtml } from "src/common/decorators/strip-html.decorator";

export class UpdateProfileDto {
    @IsOptional() @StripHtml() @IsString() @IsNotEmpty() firstName?: string;
    @IsOptional() @StripHtml() @IsString() @IsNotEmpty() lastName?: string;
    @IsOptional() @NormalizeEmail() @IsEmail() email?: string;
    @IsOptional() @StripHtml() @IsString() jobTitle?: string;
}