import { Body, Controller, Get, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { RegisterUserDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { Response } from 'express';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { UserRole } from 'src/users/user.entity';
import { LoginThrottle, RegisterThrottle } from 'src/common/decorators/throttle.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Post('refresh')
    @UseGuards(JwtRefreshGuard)
    async refresh(
        @CurrentUser() user: { id: number; email: string; role: UserRole },
        @Res({ passthrough: true }) res: Response,
    ) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const { accessToken, refreshToken } = this.authService.generateTokens(payload);

        // Issue new access token
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000,
        });

        // Rotate refresh token — old one is effectively revoked
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/auth/refresh',
        });

        return { user };
    }

    @ApiOperation({ summary: 'Register a new user' })
    @Post('/register')
    @RegisterThrottle()
    registerUser(@Body() body: RegisterUserDto) {

        return this.authService.register(body);

    }

    @ApiOperation({ summary: 'User login' })
    @Post('/login')
    @LoginThrottle()
    async loginUser(@Body() body: LoginUserDto, @Res({ passthrough: true }) res: Response) {

        const { accessToken, refreshToken, user } = await this.authService.login(body);

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000,
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/auth/refresh',
        });
        return { user };
    }

    @ApiOperation({ summary: 'Get current user' })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getMe(@CurrentUser() user) {
        return user;
    }

    @Get('profile')
    @ApiOperation({ summary: 'Get the logged-in user profile' })
    @UseGuards(AuthGuard('jwt'))
    getProfile(@CurrentUser() user: { id: number }) {
        return this.authService.getProfile(user.id);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Update the logged-in user profile' })
    updateProfile(
        @CurrentUser() user: { id: number },
        @Body() dto: UpdateProfileDto,
    ) {
        return this.authService.updateProfile(user.id, dto);
    }

    @Patch('password')
    @ApiOperation({ summary: 'Change the logged-in user password' })
    changePassword(
        @CurrentUser() user: { id: number },
        @Body() dto: ChangePasswordDto,
    ) {
        return this.authService.changePassword(user.id, dto);
    }

    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token', { path: '/auth/refresh' });
        return { message: 'Logged out successfully' };
    }
}
