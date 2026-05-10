import { Claim } from "src/claims/claim.entity";
import { decimalTransformer } from "src/common/transformers/decimal.transformer";
import { Company } from "src/companies/companies.entity";
import { Employee } from "src/employees/employee.entity";
import { Column, CreateDateColumn, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

export enum PerkType {
    HEALTH_INSURANCE = 'health_insurance',
    MEAL_VOUCHER = 'meal_voucher',
    GYM_MEMBERSHIP = 'gym_membership',
    TRANSPORT = 'transport',
    REMOTE_WORK = 'remote_work',
}

@Entity()
export class BenefitPackage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string

    @Column({ nullable: true })
    description: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'simple-array', nullable: true })
    perks: PerkType[];

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
        transformer: decimalTransformer
    })
    maxBenefitAmount: number;

    @Column({ type: 'date', nullable: true })
    startDate: Date;

    @Column({ type: 'date', nullable: true })
    endDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Company, (company) => company.benefitPackages)
    company: Company;

    @ManyToMany(() => Employee, (employee) => employee.benefitPackages)
    employees: Employee[];

    @OneToMany(() => Claim, (claim) => claim.benefitPackage)
    claims: Claim[];
}