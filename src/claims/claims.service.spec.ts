import { Test, TestingModule } from '@nestjs/testing';
import { ClaimsService } from './claims.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Claim, ClaimStatus, ClaimType } from './claim.entity';
import { Employee } from 'src/employees/employee.entity';
import { BenefitPackage } from 'src/benefit-packages/benefit-package.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

const mockQB = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
};

const mockClaimsRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQB),
};

const mockEmployeesRepository = {
  findOne: jest.fn(),
};

const mockBenefitPackagesRepository = {
  findOne: jest.fn(),
  findOneBy: jest.fn(),
};

describe('ClaimsService', () => {
  let service: ClaimsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsService,
        { provide: getRepositoryToken(Claim), useValue: mockClaimsRepository },
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmployeesRepository,
        },
        {
          provide: getRepositoryToken(BenefitPackage),
          useValue: mockBenefitPackagesRepository,
        },
      ],
    }).compile();

    service = module.get<ClaimsService>(ClaimsService);
    jest.resetAllMocks();
    // Restore QB chain after reset
    mockClaimsRepository.createQueryBuilder.mockReturnValue(mockQB);
    Object.keys(mockQB).forEach((k) => {
      if (k !== 'getRawOne') (mockQB as any)[k].mockReturnThis?.();
    });
  });

  // ─── createClaim() ──────────────────────────────────────────────────────────
  describe('createClaim()', () => {
    const userId = 1;
    const dto = {
      benefitPackageId: 10,
      amount: 100,
      title: 'Gym',
      claimType: ClaimType.GYM,
    };

    it('creates a claim successfully when employee is enrolled and within limit', async () => {
      const pkg = { id: 10, maxBenefitAmount: 500 };
      const employee = { id: 5, benefitPackages: [{ id: 10 }] };
      const savedClaim = { id: 99 };
      const fullClaim = { id: 99, title: 'Gym' };

      mockEmployeesRepository.findOne.mockResolvedValue(employee);
      mockBenefitPackagesRepository.findOneBy.mockResolvedValue(pkg);
      mockQB.getRawOne.mockResolvedValue({ total: '200' }); // committed = 200
      mockClaimsRepository.create.mockReturnValue(savedClaim);
      mockClaimsRepository.save.mockResolvedValue(savedClaim);
      mockClaimsRepository.findOne.mockResolvedValue(fullClaim);

      const result = await service.createClaim(dto, userId);
      expect(mockClaimsRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws NotFoundException when employee profile not found', async () => {
      mockEmployeesRepository.findOne.mockResolvedValue(null);
      await expect(service.createClaim(dto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when benefit package not found', async () => {
      mockEmployeesRepository.findOne.mockResolvedValue({
        id: 5,
        benefitPackages: [],
      });
      mockBenefitPackagesRepository.findOneBy.mockResolvedValue(null);
      await expect(service.createClaim(dto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when employee is not enrolled in the package', async () => {
      mockEmployeesRepository.findOne.mockResolvedValue({
        id: 5,
        benefitPackages: [{ id: 99 }],
      }); // different package
      mockBenefitPackagesRepository.findOneBy.mockResolvedValue({
        id: 10,
        maxBenefitAmount: 500,
      });

      await expect(service.createClaim(dto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when claim would exceed the package limit', async () => {
      const pkg = { id: 10, maxBenefitAmount: 250 };
      const employee = { id: 5, benefitPackages: [{ id: 10 }] };

      mockEmployeesRepository.findOne.mockResolvedValue(employee);
      mockBenefitPackagesRepository.findOneBy.mockResolvedValue(pkg);
      mockQB.getRawOne.mockResolvedValue({ total: '200' }); // committed = 200, new amount = 100 → total 300 > 250

      await expect(service.createClaim(dto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows claim when package has no maxBenefitAmount (no limit)', async () => {
      const pkg = { id: 10, maxBenefitAmount: null };
      const employee = { id: 5, benefitPackages: [{ id: 10 }] };
      const fullClaim = { id: 99 };

      mockEmployeesRepository.findOne.mockResolvedValue(employee);
      mockBenefitPackagesRepository.findOneBy.mockResolvedValue(pkg);
      mockClaimsRepository.create.mockReturnValue({ id: 99 });
      mockClaimsRepository.save.mockResolvedValue({ id: 99 });
      mockClaimsRepository.findOne.mockResolvedValue(fullClaim);

      const result = await service.createClaim(dto, userId);
      // getCommittedAmount should NOT be called when there's no limit
      expect(mockClaimsRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ─── findAll() ──────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    const pagination = { page: 1, limit: 20 };

    it('returns paginated results with no filters', async () => {
      const claims = [{ id: 1 }, { id: 2 }];
      mockClaimsRepository.findAndCount.mockResolvedValue([claims, 2]);

      const result = await service.findAll(pagination, {});
      expect(result.meta.total).toBe(2);
      expect(result.items).toHaveLength(2);
    });

    it('applies status filter', async () => {
      mockClaimsRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(pagination, { status: ClaimStatus.PENDING });

      const callArgs = mockClaimsRepository.findAndCount.mock.calls[0][0];
      expect(callArgs.where).toMatchObject({ status: ClaimStatus.PENDING });
    });

    it('applies Between for date range when both fromDate and toDate provided', async () => {
      mockClaimsRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(pagination, {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
      });

      const callArgs = mockClaimsRepository.findAndCount.mock.calls[0][0];
      expect(callArgs.where.createdAt).toEqual(
        Between(new Date('2024-01-01'), new Date('2024-12-31')),
      );
    });

    it('applies MoreThanOrEqual when only fromDate is provided', async () => {
      mockClaimsRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(pagination, { fromDate: '2024-06-01' });

      const callArgs = mockClaimsRepository.findAndCount.mock.calls[0][0];
      expect(callArgs.where.createdAt).toEqual(
        MoreThanOrEqual(new Date('2024-06-01')),
      );
    });

    it('applies LessThanOrEqual when only toDate is provided', async () => {
      mockClaimsRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(pagination, { toDate: '2024-12-31' });

      const callArgs = mockClaimsRepository.findAndCount.mock.calls[0][0];
      expect(callArgs.where.createdAt).toEqual(
        LessThanOrEqual(new Date('2024-12-31')),
      );
    });

    it('returns correct totalPages in meta', async () => {
      mockClaimsRepository.findAndCount.mockResolvedValue([
        new Array(20).fill({}),
        55,
      ]);

      const result = await service.findAll({ page: 1, limit: 20 }, {});
      expect(result.meta.totalPages).toBe(3);
    });
  });

  // ─── findByCompany() ────────────────────────────────────────────────────────
  describe('findByCompany()', () => {
    it('returns claims scoped to the given company', async () => {
      const claims = [{ id: 1 }, { id: 2 }];
      mockClaimsRepository.find.mockResolvedValue(claims);

      const result = await service.findByCompany(5, {});

      const callArgs = mockClaimsRepository.find.mock.calls[0][0];
      expect(callArgs.where.employee).toEqual({ company: { id: 5 } });
      expect(result).toHaveLength(2);
    });

    it('applies status filter when scoped to company', async () => {
      mockClaimsRepository.find.mockResolvedValue([]);

      await service.findByCompany(5, { status: ClaimStatus.APPROVED });

      const callArgs = mockClaimsRepository.find.mock.calls[0][0];
      expect(callArgs.where.status).toBe(ClaimStatus.APPROVED);
    });

    it('applies date range for company-scoped claims', async () => {
      mockClaimsRepository.find.mockResolvedValue([]);

      await service.findByCompany(5, {
        fromDate: '2024-01-01',
        toDate: '2024-06-30',
      });

      const callArgs = mockClaimsRepository.find.mock.calls[0][0];
      expect(callArgs.where.createdAt).toEqual(
        Between(new Date('2024-01-01'), new Date('2024-06-30')),
      );
    });
  });
});
