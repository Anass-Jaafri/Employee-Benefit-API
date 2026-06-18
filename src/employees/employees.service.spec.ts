import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employees.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { User, UserRole } from 'src/users/user.entity';
import { CompaniesService } from 'src/companies/companies.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { IsNull } from 'typeorm';

const mockEmployeesRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
  findAndCount: jest.fn(),
};

const mockUsersRepository = {
  update: jest.fn(),
};

const mockCompaniesService = {
  findOneEntity: jest.fn(),
};

describe('EmployeesService', () => {
  let service: EmployeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmployeesRepository,
        },
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        { provide: CompaniesService, useValue: mockCompaniesService },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    jest.resetAllMocks();
  });

  // ─── updateRole() ───────────────────────────────────────────────────────────
  describe('updateRole()', () => {
    const hrUserId = 10;
    const hrCompany = { id: 1 };

    it('updates role successfully for an employee in the same company', async () => {
      const hrEmployee = { company: hrCompany };
      const targetEmployee = {
        id: 5,
        company: hrCompany,
        user: { id: 20, role: UserRole.EMPLOYEE },
      };

      // findCompanyByUserId → finds HR's employee
      mockEmployeesRepository.findOne
        .mockResolvedValueOnce({ ...hrEmployee, company: hrCompany }) // HR lookup
        .mockResolvedValueOnce(targetEmployee) // target load
        .mockResolvedValueOnce({
          ...targetEmployee,
          user: { id: 20, role: UserRole.HR_MANAGER },
        }); // reload

      mockUsersRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateRole(5, UserRole.HR_MANAGER, hrUserId);
      expect(mockUsersRepository.update).toHaveBeenCalledWith(20, {
        role: UserRole.HR_MANAGER,
      });
      expect(result).toBeDefined();
    });

    it('throws ForbiddenException when assigning admin role', async () => {
      await expect(
        service.updateRole(5, UserRole.ADMIN, hrUserId),
      ).rejects.toThrow(ForbiddenException);
      // Should throw before any DB calls
      expect(mockEmployeesRepository.findOne).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when target employee is in a different company', async () => {
      const otherCompany = { id: 999 };
      mockEmployeesRepository.findOne
        .mockResolvedValueOnce({ company: hrCompany }) // HR lookup
        .mockResolvedValueOnce({
          id: 5,
          company: otherCompany,
          user: { id: 20 },
        }); // target

      await expect(
        service.updateRole(5, UserRole.EMPLOYEE, hrUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when HR tries to change their own role', async () => {
      const targetEmployee = {
        id: 3,
        company: hrCompany,
        user: { id: hrUserId }, // same as hrUserId — self-demotion
      };

      mockEmployeesRepository.findOne
        .mockResolvedValueOnce({ company: hrCompany }) // HR lookup
        .mockResolvedValueOnce(targetEmployee); // target

      await expect(
        service.updateRole(3, UserRole.EMPLOYEE, hrUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when target employee does not exist', async () => {
      mockEmployeesRepository.findOne
        .mockResolvedValueOnce({ company: hrCompany }) // HR lookup
        .mockResolvedValueOnce(null); // target not found

      await expect(
        service.updateRole(999, UserRole.EMPLOYEE, hrUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findUnassigned() ───────────────────────────────────────────────────────
  describe('findUnassigned()', () => {
    it('returns only employees with no company', async () => {
      const unassigned = [
        { id: 1, firstName: 'Jane', company: null, user: null },
        { id: 2, firstName: 'Bob', company: null, user: null },
      ];
      mockEmployeesRepository.find.mockResolvedValue(unassigned);

      const result = await service.findUnassigned();

      expect(mockEmployeesRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { company: IsNull() } }),
      );
      expect(result).toHaveLength(2);
    });

    it('returns empty array when all employees are assigned', async () => {
      mockEmployeesRepository.find.mockResolvedValue([]);
      const result = await service.findUnassigned();
      expect(result).toHaveLength(0);
    });
  });

  // ─── assignCompany() ────────────────────────────────────────────────────────
  describe('assignCompany()', () => {
    it('assigns company to employee and returns updated DTO', async () => {
      const employee = {
        id: 7,
        user: null,
        company: null,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@x.com',
        status: 'active',
      };
      const saved = { id: 7 };
      const reloaded = { ...employee, company: { id: 5, name: 'Acme' } };

      mockEmployeesRepository.findOne
        .mockResolvedValueOnce(employee) // initial load
        .mockResolvedValueOnce(reloaded); // reload after save

      mockEmployeesRepository.save.mockResolvedValue(saved);

      const result = await service.assignCompany(7, 5);
      expect(mockEmployeesRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws NotFoundException when employee does not exist', async () => {
      mockEmployeesRepository.findOne.mockResolvedValue(null);
      await expect(service.assignCompany(999, 5)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
