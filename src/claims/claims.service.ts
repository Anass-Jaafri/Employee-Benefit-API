import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim, ClaimStatus } from './claim.entity';
import { CreateClaimDto } from './dto/create-claim.dto';
import { ReviewClaimDto } from './dto/review-claim.dto';
import { Employee } from '../employees/employee.entity';
import { BenefitPackage } from '../benefit-packages/benefit-package.entity';
import { ClaimResponseDto } from './dto/claim-response.dto';
import { toDto, toDtoArray } from 'src/common/helpers/serialize';

@Injectable()
export class ClaimsService {
    constructor(
        @InjectRepository(Claim)
        private claimsRepository: Repository<Claim>,
        @InjectRepository(Employee)
        private employeesRepository: Repository<Employee>,
        @InjectRepository(BenefitPackage)
        private benefitPackagesRepository: Repository<BenefitPackage>,
    ) { }

    async findAll(): Promise<ClaimResponseDto[]> {
        const claims = await this.claimsRepository.find({
            relations: ['employee', 'benefitPackage', 'reviewedBy']
        });
        return toDtoArray(ClaimResponseDto, claims);
    }

    async findOne(id: number): Promise<ClaimResponseDto> {
        const claim = await this.claimsRepository.findOne({
            where: { id },
            relations: ['employee', 'benefitPackage', 'reviewedBy'],
        });
        if (!claim) throw new NotFoundException('Claim not found');
        return toDto(ClaimResponseDto, claim);
    }

    async findMyClaims(userId: number): Promise<ClaimResponseDto[]> {
        const employee = await this.employeesRepository.findOne({
            where: { user: { id: userId } },
        });

        if (!employee) throw new NotFoundException('Employee profile not found');
        const claim = await this.claimsRepository.find({
            where: { employee: { id: employee.id } },
            relations: ['employee', 'benefitPackage', 'reviewedBy'],
            order: { createdAt: 'DESC' },
        });
        return toDtoArray(ClaimResponseDto, claim);
    }

    private async getCommittedAmount(
        packageId: number,
        employeeId: number,
    ): Promise<number> {
        const result = await this.claimsRepository
            .createQueryBuilder('claim')
            .select('SUM(claim.amount)', 'total')
            .where('claim.benefitPackageId = :packageId', { packageId })
            .andWhere('claim.employeeId = :employeeId', { employeeId })
            .andWhere('claim.status IN (:...statuses)', {
                statuses: [ClaimStatus.APPROVED, ClaimStatus.PENDING, ClaimStatus.PAID],
            })
            .getRawOne();

        return parseFloat(result.total) || 0;
    }

    async createClaim(data: CreateClaimDto, userId: number): Promise<ClaimResponseDto> {
        // find the employee profile linked to the logged-in user
        const employee = await this.employeesRepository.findOne({
            where: { user: { id: userId } },
            relations: ['benefitPackages'],
        });
        if (!employee) throw new NotFoundException('Employee profile not found');

        // verify the package exists
        const benefitPackage = await this.benefitPackagesRepository.findOneBy({
            id: data.benefitPackageId,
        });
        if (!benefitPackage)
            throw new NotFoundException('Benefit package not found');

        // verify the employee is enrolled in this package
        const isEnrolled = employee.benefitPackages.some(
            (pkg) => pkg.id === data.benefitPackageId,
        );
        if (!isEnrolled)
            throw new BadRequestException(
                'Employee is not enrolled in this benefit package',
            );

        // verify claim amount doesn't exceed package limit
        if (benefitPackage.maxBenefitAmount) {
            const committed = await this.getCommittedAmount(
                data.benefitPackageId,
                employee.id,
            );
            if (committed + data.amount > benefitPackage.maxBenefitAmount)
                throw new BadRequestException(
                    `Insufficient remaining benefit amount. Used: ${committed}, Limit: ${benefitPackage.maxBenefitAmount}`,
                );
        }

        const claim = this.claimsRepository.create({
            ...data,
            employee,
            benefitPackage,
            status: ClaimStatus.PENDING,
        });
        const saved = await this.claimsRepository.save(claim);

        const full = await this.claimsRepository.findOne({
            where: { id: saved.id },
            relations: ['employee', 'employee.company', 'benefitPackage', 'reviewedBy']
        });

        return toDto(ClaimResponseDto, full!);;
    }

    async getRemainingAmount(packageId: number, employeeId: number) {
        const pkg = await this.benefitPackagesRepository.findOneBy({ id: packageId });
        if (!pkg) throw new NotFoundException('Benefit package not found');

        if (!pkg.maxBenefitAmount) {
            return {
                packageId,
                employeeId,
                maxBenefitAmount: null,
                committed: 0,
                remainingAmount: null,
                note: 'No limit set for this package',
            };
        }

        const committed = await this.getCommittedAmount(packageId, employeeId);

        return {
            packageId,
            employeeId,
            maxBenefitAmount: pkg.maxBenefitAmount,
            committed,
            remainingAmount: pkg.maxBenefitAmount - committed,
        };
    }

    async reviewClaim(
        claimId: number,
        data: ReviewClaimDto,
        reviewerId: number,
    ): Promise<ClaimResponseDto> {
        const claim = await this.claimsRepository.findOne({
            where: { id: claimId },
            relations: ['employee', 'employee.company', 'benefitPackage', 'reviewedBy'],
        });
        if (!claim) throw new NotFoundException('Claim not found');
        // can only review pending claims
        if (claim.status !== ClaimStatus.PENDING)
            throw new BadRequestException(`Claim has already been ${claim.status}`);

        // rejection requires a reason
        if (data.status === ClaimStatus.REJECTED && !data.rejectionReason)
            throw new BadRequestException(
                'Rejection reason is required when rejecting a claim',
            );

        claim.status = data.status;
        claim.rejectionReason = data.rejectionReason ?? null;
        claim.reviewedBy = { id: reviewerId } as any;
        claim.reviewedAt = new Date();

        const saved = await this.claimsRepository.save(claim);
        const full = await this.claimsRepository.findOne({
            where: { id: saved.id },
            relations: ['employee', 'employee.company', 'benefitPackage', 'reviewedBy'],
        });

        return toDto(ClaimResponseDto, full!);
    }
}
