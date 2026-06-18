import { Test, TestingModule } from '@nestjs/testing';
import { BenefitPackagesService } from './benefit-packages.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BenefitPackage } from './benefit-package.entity';
import { Employee } from 'src/employees/employee.entity';
import { CompaniesService } from 'src/companies/companies.service';
import { EmployeesService } from 'src/employees/employees.service';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

const mockBenefitPackagesRepository = {
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  findAndCount: jest.fn(),
};

const mockEmployeesRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockCompaniesService = {
  findOneEntity: jest.fn(),
};

const mockEmployeesService = {
  findCompanyByUserId: jest.fn(),
};

describe('BenefitPackagesService', () => {
  let service: BenefitPackagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BenefitPackagesService,
        {
          provide: getRepositoryToken(BenefitPackage),
          useValue: mockBenefitPackagesRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmployeesRepository,
        },
        { provide: CompaniesService, useValue: mockCompaniesService },
        { provide: EmployeesService, useValue: mockEmployeesService },
      ],
    }).compile();

    service = module.get<BenefitPackagesService>(BenefitPackagesService);
    jest.resetAllMocks();
  });

  // ─── createPackageForMyCompany() ────────────────────────────────────────────
  describe('createPackageForMyCompany()', () => {
    it('resolves company from userId and creates package', async () => {
      const company = { id: 3, name: 'Acme' };
      const dto = { name: 'Health Plus' };
      const savedPkg = { id: 1 };
      const fullPkg = { id: 1, company };

      mockEmployeesService.findCompanyByUserId.mockResolvedValue(company);
      mockBenefitPackagesRepository.create.mockReturnValue(savedPkg);
      mockBenefitPackagesRepository.save.mockResolvedValue(savedPkg);
      mockBenefitPackagesRepository.findOne.mockResolvedValue(fullPkg);

      const result = await service.createPackageForMyCompany(10, dto as any);

      expect(mockEmployeesService.findCompanyByUserId).toHaveBeenCalledWith(10);
      expect(mockBenefitPackagesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ company }),
      );
      expect(result).toBeDefined();
    });

    it('throws NotFoundException when user has no associated company', async () => {
      mockEmployeesService.findCompanyByUserId.mockRejectedValue(
        new NotFoundException('No company associated'),
      );

      await expect(
        service.createPackageForMyCompany(99, { name: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── verifyOwnership() ──────────────────────────────────────────────────────
  describe('verifyOwnership()', () => {
    it('resolves without error when package belongs to HR company', async () => {
      const company = { id: 5 };
      mockEmployeesRepository.findOne.mockResolvedValue({ company });
      mockBenefitPackagesRepository.findOne.mockResolvedValue({
        id: 1,
        company,
      });

      await expect(service.verifyOwnership(1, 10)).resolves.toBeUndefined();
    });

    it('throws ForbiddenException when package belongs to a different company', async () => {
      mockEmployeesRepository.findOne.mockResolvedValue({ company: { id: 5 } });
      mockBenefitPackagesRepository.findOne.mockResolvedValue({
        id: 1,
        company: { id: 99 },
      });

      await expect(service.verifyOwnership(1, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when package does not exist', async () => {
      mockEmployeesRepository.findOne.mockResolvedValue({ company: { id: 5 } });
      mockBenefitPackagesRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyOwnership(999, 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when HR has no company', async () => {
      mockEmployeesRepository.findOne.mockResolvedValue(null); // no employee
      mockBenefitPackagesRepository.findOne.mockResolvedValue({
        id: 1,
        company: { id: 5 },
      });

      await expect(service.verifyOwnership(1, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── verifyEmployeeOwnership() ──────────────────────────────────────────────
  describe('verifyEmployeeOwnership()', () => {
    it('resolves without error when employee is in HR company', async () => {
      const hrCompany = { id: 5 };
      mockEmployeesService.findCompanyByUserId.mockResolvedValue(hrCompany);
      mockEmployeesRepository.findOne.mockResolvedValue({
        id: 7,
        company: hrCompany,
      });

      await expect(
        service.verifyEmployeeOwnership(7, 10),
      ).resolves.toBeUndefined();
    });

    it('throws ForbiddenException when employee is in a different company', async () => {
      mockEmployeesService.findCompanyByUserId.mockResolvedValue({ id: 5 });
      mockEmployeesRepository.findOne.mockResolvedValue({
        id: 7,
        company: { id: 99 },
      });

      await expect(service.verifyEmployeeOwnership(7, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when employee does not exist', async () => {
      mockEmployeesService.findCompanyByUserId.mockResolvedValue({ id: 5 });
      mockEmployeesRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyEmployeeOwnership(999, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── enrollEmployee() ───────────────────────────────────────────────────────
  describe('enrollEmployee()', () => {
    it('enrolls employee successfully', async () => {
      const pkg = { id: 20 };
      const employee = { id: 7, benefitPackages: [{ id: 5 }] }; // enrolled in a different package

      mockBenefitPackagesRepository.findOne.mockResolvedValue(pkg);
      mockEmployeesRepository.findOne.mockResolvedValue(employee);
      mockEmployeesRepository.save.mockResolvedValue({
        ...employee,
        benefitPackages: [{ id: 5 }, pkg],
      });

      const result = await service.enrollEmployee(20, 7);
      expect(mockEmployeesRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Employee enrolled successfully' });
    });

    it('throws ConflictException when employee is already enrolled', async () => {
      const pkg = { id: 20 };
      const employee = { id: 7, benefitPackages: [{ id: 20 }] }; // already enrolled

      mockBenefitPackagesRepository.findOne.mockResolvedValue(pkg);
      mockEmployeesRepository.findOne.mockResolvedValue(employee);

      await expect(service.enrollEmployee(20, 7)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws NotFoundException when package does not exist', async () => {
      mockBenefitPackagesRepository.findOne.mockResolvedValue(null);

      await expect(service.enrollEmployee(999, 7)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when employee does not exist', async () => {
      mockBenefitPackagesRepository.findOne.mockResolvedValue({ id: 20 });
      mockEmployeesRepository.findOne.mockResolvedValue(null);

      await expect(service.enrollEmployee(20, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
