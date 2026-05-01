import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/users/user.entity';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async register(data: RegisterUserDto) {

        // check if email exists
        const existing = await this.usersService.findByEmail(data.email);
        if (existing) throw new ConflictException('Email already in use');

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.usersService.create(data.email, hashedPassword);

        return { message: 'User registered successfully', userId: user.id };
    }

    async login(data: LoginUserDto) {

        //Find user
        const user = await this.usersService.findByEmail(data.email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        //Compare passwords
        const isMatch = await bcrypt.compare(data.password, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        //Generate JWT token
        const payload = { sub: user.id, email: user.email, role: user.role };
        const token = await this.jwtService.signAsync(payload);

        return { access_token: token };

    }
}
