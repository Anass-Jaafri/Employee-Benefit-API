import { Employee } from './employee.model';
import { BenefitPackage } from './benefit-package.model';
import { User } from './user.model';

export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'paid';
export type ClaimType = 'medical' | 'gym' | 'transport' | 'meal' | 'other';

export interface Claim {
    id: number;
    title: string;
    description: string | null;
    amount: number;
    status: ClaimStatus;
    claimType: ClaimType;
    attachmentUrl: string | null;
    rejectionReason: string | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
    employee: Employee;
    benefitPackage: BenefitPackage;
    reviewedBy: User | null;
}