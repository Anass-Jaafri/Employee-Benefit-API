import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RegisterUserDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @ApiOperation({ summary: 'Register a new user' })
    @Post('/register')
    registerUser(@Body() body: RegisterUserDto) {

        return this.authService.register(body);

    }

    @ApiOperation({ summary: 'User login' })
    @Post('/login')
    loginUser(@Body() body: LoginUserDto) {

        return this.authService.login(body);

    }

    @ApiOperation({ summary: 'Get current user' })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getMe(@CurrentUser() user) {
        return user;
    }


}
