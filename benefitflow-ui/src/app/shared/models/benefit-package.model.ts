import { Company } from "./company.model";

export type PerkType =
    | 'health_insurance'
    | 'meal_voucher'
    | 'gym_membership'
    | 'transport'
    | 'remote_work';

export interface BenefitPackage {
    id: number;
    name: string;
    description: string | null;
    isActive: boolean;
    perks: PerkType[];
    maxBenefitAmount: number | null;
    startDate: string | null;   // 'YYYY-MM-DD' — date type from backend
    endDate: string | null;
    createdAt: string;
    company: Company;
}