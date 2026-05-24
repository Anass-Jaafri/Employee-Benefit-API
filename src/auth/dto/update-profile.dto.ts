import { IsOptional, IsString, IsNotEmpty, IsEmail } from "class-validator";

export class UpdateProfileDto {
    @IsOptional() @IsString() @IsNotEmpty() firstName?: string;
    @IsOptional() @IsString() @IsNotEmpty() lastName?: string;
    @IsOptional() @IsEmail() email?: string;
    @IsOptional() @IsString() jobTitle?: string;
}