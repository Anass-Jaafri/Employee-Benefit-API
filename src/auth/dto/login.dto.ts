import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { NormalizeEmail } from "src/common/decorators/normalize-email.decorator";

export class LoginUserDto {


    @IsEmail()
    @NormalizeEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;

}