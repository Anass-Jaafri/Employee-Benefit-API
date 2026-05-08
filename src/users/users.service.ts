import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from './user.entity';
import { Repository } from 'typeorm';


@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>,
    ) { }

    findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOneBy({ email });
    }

    create(email: string, hashedPassword: string): Promise<User> {
        const user = this.usersRepository.create({ email, password: hashedPassword });
        return this.usersRepository.save(user);

    }

    async updateRole(id: number, role: UserRole): Promise<{ message: string }> {

        const user = await this.usersRepository.findOneBy({ id });
        if (!user) throw new NotFoundException('User not found');
        user.role = role;
        await this.usersRepository.save(user);
        return { message: `User role updated to ${role}` };

    }

}
