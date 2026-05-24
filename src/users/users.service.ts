import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from './user.entity';
import { Repository } from 'typeorm';
import { UserResponseDto } from './dto/user-response.dto';
import { toDto } from 'src/common/helpers/serialize';


@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOneBy({ email });
    }

    async create(email: string, hashedPassword: string): Promise<UserResponseDto> {
        const user = await this.usersRepository.create({ email, password: hashedPassword });
        const saved = await this.usersRepository.save(user)
        return toDto(UserResponseDto, saved);

    }

    async updateRole(id: number, role: UserRole): Promise<{ message: string }> {

        const user = await this.usersRepository.findOneBy({ id });
        if (!user) throw new NotFoundException('User not found');
        user.role = role;
        await this.usersRepository.save(user);
        return { message: `User role updated to ${role}` };

    }

}
