import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from "class-validator";
import { NormalizeEmail } from "src/common/decorators/normalize-email.decorator";
import { StripHtml } from "src/common/decorators/strip-html.decorator";


export class RegisterUserDto {
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

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password: string;

}