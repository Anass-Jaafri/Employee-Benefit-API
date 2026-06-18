import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from 'src/users/user.entity';
import { Employee } from 'src/employees/employee.entity';
import { Company } from 'src/companies/companies.entity';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

const mockUsersService = { findByEmail: jest.fn() };
const mockJwtService = { sign: jest.fn().mockReturnValue('mock-token') };
const mockConfigService = { get: jest.fn().mockReturnValue('refresh-secret') };

const mockManager = { create: jest.fn(), save: jest.fn() };
const mockDataSource = {
  transaction: jest.fn((cb: (m: any) => any) => cb(mockManager)),
  getRepository: jest.fn(),
};

const mockUsersRepository = { findOne: jest.fn(), save: jest.fn() };
const mockEmployeesRepository = { findOne: jest.fn() };
const mockCompaniesRepository = { findOne: jest.fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmployeesRepository,
        },
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompaniesRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.resetAllMocks();
    mockJwtService.sign.mockReturnValue('mock-token');
    mockConfigService.get.mockReturnValue('refresh-secret');
    mockDataSource.transaction.mockImplementation((cb) => cb(mockManager));
    mockJwtService.sign.mockReturnValue('mock-token');
    mockConfigService.get.mockReturnValue('refresh-secret');
    mockDataSource.transaction.mockImplementation((cb: (m: any) => any) =>
      cb(mockManager),
    );
  });

  // ─── register() ────────────────────────────────────────────────────────────
  describe('register()', () => {
    const dto = {
      email: 'john@acme.com',
      password: 'Password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('creates user and employee successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockCompaniesRepository.findOne.mockResolvedValue(null);
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-pw');
      const savedUser = { id: 1, email: dto.email };
      mockManager.create
        .mockReturnValueOnce(savedUser)
        .mockReturnValueOnce({ id: 1 });
      mockManager.save
        .mockResolvedValueOnce(savedUser)
        .mockResolvedValueOnce({ id: 1 });

      const result = await service.register(dto);
      expect(result).toEqual({
        message: 'User registered successfully',
        userId: 1,
      });
      expect(mockManager.create).toHaveBeenCalledTimes(2);
    });

    it('throws ConflictException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 1 });
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('auto-assigns company when domain matches an active company', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const company = { id: 42, domain: 'acme.com', isActive: true };
      mockCompaniesRepository.findOne.mockResolvedValue(company);
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-pw');
      const savedUser = { id: 1 };
      mockManager.create.mockReturnValueOnce(savedUser).mockReturnValueOnce({});
      mockManager.save
        .mockResolvedValueOnce(savedUser)
        .mockResolvedValueOnce({});

      await service.register(dto);

      const empCreateArgs = mockManager.create.mock.calls[1][1];
      expect(empCreateArgs.company).toEqual(company);
    });

    it('leaves company undefined when no domain match', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockCompaniesRepository.findOne.mockResolvedValue(null);
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-pw');
      const savedUser = { id: 1 };
      mockManager.create.mockReturnValueOnce(savedUser).mockReturnValueOnce({});
      mockManager.save
        .mockResolvedValueOnce(savedUser)
        .mockResolvedValueOnce({});

      await service.register(dto);

      const empCreateArgs = mockManager.create.mock.calls[1][1];
      expect(empCreateArgs.company).toBeUndefined();
    });
  });

  // ─── login() ────────────────────────────────────────────────────────────────
  describe('login()', () => {
    const dto = { email: 'john@acme.com', password: 'Password123' };

    it('returns tokens and user on valid credentials', async () => {
      const user = {
        id: 1,
        email: dto.email,
        role: UserRole.EMPLOYEE,
        password: 'hashed',
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);
      expect(result).toEqual({
        accessToken: 'mock-token',
        refreshToken: 'mock-token',
        user: { id: 1, email: dto.email, role: UserRole.EMPLOYEE },
      });
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 1,
        password: 'hashed',
      });
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── getProfile() ───────────────────────────────────────────────────────────
  describe('getProfile()', () => {
    it('returns profile with employee data', async () => {
      const user = { id: 1, email: 'john@acme.com', role: UserRole.EMPLOYEE };
      const employee = {
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: 'Engineer',
        company: { id: 5 },
      };
      mockUsersRepository.findOne.mockResolvedValue(user);
      mockEmployeesRepository.findOne.mockResolvedValue(employee);

      const result = await service.getProfile(1);
      expect(result).toMatchObject({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: 'Engineer',
      });
    });

    it('returns null employee fields for admin (no employee record)', async () => {
      const user = { id: 99, email: 'admin@app.com', role: UserRole.ADMIN };
      mockUsersRepository.findOne.mockResolvedValue(user);
      mockEmployeesRepository.findOne.mockResolvedValue(null);

      const result = await service.getProfile(99);
      expect(result).toMatchObject({
        id: 99,
        firstName: null,
        lastName: null,
        jobTitle: null,
      });
    });

    it('throws NotFoundException when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);
      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateProfile() ────────────────────────────────────────────────────────
  describe('updateProfile()', () => {
    it('only updates user for admin (no employee record)', async () => {
      const user = { id: 99, email: 'admin@app.com', role: UserRole.ADMIN };
      mockUsersRepository.findOne
        .mockResolvedValueOnce(user) // load user
        .mockResolvedValueOnce(null); // email uniqueness — no conflict
      mockEmployeesRepository.findOne.mockResolvedValueOnce(null);
      mockManager.save.mockResolvedValue(user);
      jest.spyOn(service, 'getProfile').mockResolvedValue({} as any);

      await service.updateProfile(99, { email: 'new@app.com' });

      // Only one save call: the user — no employee save
      expect(mockManager.save.mock.calls.length).toBe(1);
    });

    it('updates both user and employee fields', async () => {
      const user = { id: 1, email: 'john@acme.com', role: UserRole.EMPLOYEE };
      const employee = {
        id: 10,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@acme.com',
        jobTitle: null,
      };
      mockUsersRepository.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null); // no email conflict
      mockEmployeesRepository.findOne.mockResolvedValueOnce(employee);
      mockManager.save.mockResolvedValue({});
      jest.spyOn(service, 'getProfile').mockResolvedValue({} as any);

      await service.updateProfile(1, { firstName: 'Johnny', jobTitle: 'Lead' });
      expect(employee.firstName).toBe('Johnny');
      expect(employee.jobTitle).toBe('Lead');
    });

    it('throws ConflictException when new email is already taken', async () => {
      const user = { id: 1, email: 'john@acme.com' };
      mockUsersRepository.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce({ id: 2, email: 'taken@acme.com' }); // conflict
      mockEmployeesRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateProfile(1, { email: 'taken@acme.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
