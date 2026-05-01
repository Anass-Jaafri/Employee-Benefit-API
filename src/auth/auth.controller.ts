import { Body, Controller, Post } from '@nestjs/common';
import { RegisterUserDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Post('/register')
    registerUser(@Body() body: RegisterUserDto) {

        return this.authService.register(body);

    }

    @Post('/login')
    loginUser(@Body() body: LoginUserDto) {

        return this.authService.login(body);

    }


}
