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
import { Company } from 'src/companies/companies.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private dataSource: DataSource,
    private config: ConfigService,

    @InjectRepository(Company) private companiesRepository: Repository<Company>,
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
  ) {}

  async register(data: RegisterUserDto) {
    // check if email exists
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already in use');

    const emailDomain = data.email.split('@')[1]?.toLowerCase();
    let assignedCompany: Company | null = null;

    if (emailDomain) {
      assignedCompany = await this.companiesRepository.findOne({
        where: { domain: emailDomain, isActive: true },
      });
      // No match employee stays unassigned.
    }
    return this.dataSource.transaction(async (manager) => {
      const hashedPassword = await bcrypt.hash(data.password, 10);

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
        company: assignedCompany ?? undefined,
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

  async getProfile(userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Employee record is optional — admin users have no employee record.
    const employee = await this.employeesRepository.findOne({
      where: { user: { id: userId } },
      relations: ['company'],
    });

    // Construct the profile object — employee fields are null for admin.
    return toDto(ProfileResponseDto, {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: employee?.firstName ?? null,
      lastName: employee?.lastName ?? null,
      jobTitle: employee?.jobTitle ?? null,
      status: employee?.status ?? null,
      companyId: employee?.company?.id ?? null,
    });
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const employee = await this.employeesRepository.findOne({
      where: { user: { id: userId } },
    });

    // Check email uniqueness if changing it
    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) throw new ConflictException('Email already in use');
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.email) user.email = dto.email;
      await manager.save(user);

      // Employee fields only apply when an employee record exists
      if (employee) {
        if (dto.firstName !== undefined) employee.firstName = dto.firstName;
        if (dto.lastName !== undefined) employee.lastName = dto.lastName;
        if (dto.email !== undefined) employee.email = dto.email;
        if (dto.jobTitle !== undefined) employee.jobTitle = dto.jobTitle;
        await manager.save(employee);
      }

      return this.getProfile(userId);
    });
  }

  async changePassword(
    userId: number,
    data: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id: userId }, select: ['id', 'password'] });
    // select: ['id', 'password'] overrides select:false for this query only

    if (!user) throw new NotFoundException('User not found');

    const passwordMatches = await bcrypt.compare(
      data.currentPassword,
      user.password,
    );
    if (!passwordMatches)
      throw new UnauthorizedException('Current password is incorrect');

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
