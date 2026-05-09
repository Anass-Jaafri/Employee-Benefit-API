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

    findAll(): Promise<Claim[]> {
        return this.claimsRepository.find({
            relations: ['employee', 'benefitPackage', 'reviewedBy'],
        });
    }

    async findOne(id: number): Promise<Claim> {
        const claim = await this.claimsRepository.findOne({
            where: { id },
            relations: ['employee', 'benefitPackage', 'reviewedBy'],
        });
        if (!claim) throw new NotFoundException('Claim not found');
        return claim;
    }

    async findMyClaims(userId: number): Promise<Claim[]> {
        const employee = await this.employeesRepository.findOne({
            where: { user: { id: userId } },
            relations: ['claims', 'claims.benefitPackage', 'claims.reviewedBy'],
        });
        if (!employee) throw new NotFoundException('Employee profile not found');
        return employee.claims;
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
                statuses: [ClaimStatus.APPROVED, ClaimStatus.PENDING],
            })
            .getRawOne();

        return parseFloat(result.total) || 0;
    }

    async createClaim(data: CreateClaimDto, userId: number): Promise<Claim> {
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

        return this.claimsRepository.save(claim);
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
    ): Promise<Claim> {
        const claim = await this.findOne(claimId);

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

        return this.claimsRepository.save(claim);
    }
}
