import {
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from 'src/users/user.entity';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from 'src/employees/employee.entity';
import { DataSource, Repository } from 'typeorm';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { toDto, toDtoArray } from 'src/common/helpers/serialize';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private dataSource: DataSource,
        private config: ConfigService
    ) { }

    async register(data: RegisterUserDto) {
        // check if email exists
        const existing = await this.usersService.findByEmail(data.email);
        if (existing) throw new ConflictException('Email already in use');

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.dataSource.transaction(async (manager) => {
            const user = manager.create(User, {
                email: data.email,
                password: hashedPassword,
            });
            await manager.save(user);
            const employee = manager.create(Employee, {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                user,
            });
            await manager.save(employee);
            return { message: 'User registered successfully', userId: user.id };
        });
    }

    async login(data: LoginUserDto) {
        //Find user
        const user = await this.usersService.findByEmail(data.email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        //Compare passwords
        const isMatch = await bcrypt.compare(data.password, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        const payload = { sub: user.id, email: user.email, role: user.role };
        const { accessToken, refreshToken } = this.generateTokens(payload);

        return {
            accessToken,
            refreshToken,
            user: { id: user.id, email: user.email, role: user.role },
        };
    }

    async getProfile(userId: number): Promise<ProfileResponseDto> {
        const employee = await this.dataSource
            .getRepository(Employee)
            .findOne({
                where: { user: { id: userId } },
                relations: ['user', 'company'],
            });

        if (!employee) throw new NotFoundException('Profile not found');

        // flatten user fields onto the employee for serialization
        const profile = {
            id: employee.user.id,
            email: employee.user.email,
            role: employee.user.role,
            firstName: employee.firstName,
            lastName: employee.lastName,
            jobTitle: employee.jobTitle,
            status: employee.status,
            company: employee.company ?? null,
        };

        return toDto(ProfileResponseDto, profile);
    }

    async updateProfile(userId: number, data: UpdateProfileDto): Promise<ProfileResponseDto> {
        return this.dataSource.transaction(async (manager) => {
            const employee = await manager.findOne(Employee, {
                where: { user: { id: userId } },
                relations: ['user', 'company'],
            });

            if (!employee) throw new NotFoundException('Profile not found');

            // update employee fields
            if (data.firstName) employee.firstName = data.firstName;
            if (data.lastName) employee.lastName = data.lastName;
            if (data.jobTitle !== undefined) employee.jobTitle = data.jobTitle;

            // email must stay in sync on both entities
            if (data.email && data.email !== employee.user.email) {
                const existing = await manager.findOneBy(User, { email: data.email });
                if (existing) throw new ConflictException('Email already in use');
                employee.user.email = data.email;
                employee.email = data.email;
                await manager.save(User, employee.user);
            }

            await manager.save(Employee, employee);

            const profile = {
                id: employee.user.id,
                email: employee.user.email,
                role: employee.user.role,
                firstName: employee.firstName,
                lastName: employee.lastName,
                jobTitle: employee.jobTitle,
                status: employee.status,
                company: employee.company ?? null,
            };

            return toDto(ProfileResponseDto, profile);
        });
    }

    async changePassword(userId: number, data: ChangePasswordDto): Promise<{ message: string }> {
        const user = await this.dataSource
            .getRepository(User)
            .findOne({ where: { id: userId }, select: ['id', 'password'] });
        // select: ['id', 'password'] overrides select:false for this query only

        if (!user) throw new NotFoundException('User not found');

        const passwordMatches = await bcrypt.compare(data.currentPassword, user.password);
        if (!passwordMatches) throw new UnauthorizedException('Current password is incorrect');

        user.password = await bcrypt.hash(data.newPassword, 10);
        await this.dataSource.getRepository(User).save(user);

        return { message: 'Password updated successfully' };
    }

    generateTokens(payload: { sub: number; email: string; role: UserRole }) {
        return {
            accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
            refreshToken: this.jwtService.sign(payload, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            }),
        };
    }
}
