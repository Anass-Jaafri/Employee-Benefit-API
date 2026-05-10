import { BenefitPackage } from "src/benefit-packages/benefit-package.entity";
import { decimalTransformer } from "src/common/transformers/decimal.transformer";
import { Employee } from "src/employees/employee.entity";
import { User } from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum ClaimStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    PAID = 'paid',
}

export enum ClaimType {
    MEDICAL = 'medical',
    GYM = 'gym',
    TRANSPORT = 'transport',
    MEAL = 'meal',
    OTHER = 'other',
}

@Entity()
export class Claim {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
        transformer: decimalTransformer
    })
    amount: number;

    @Column({
        type: 'enum',
        enum: ClaimStatus,
        default: ClaimStatus.PENDING,
    })
    status: ClaimStatus;

    @Column({
        type: 'enum',
        enum: ClaimType,
    })
    claimType: ClaimType;

    @Column({ nullable: true })
    attachmentUrl: string;

    @Column({ type: 'varchar', nullable: true })
    rejectionReason: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    reviewedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Employee, (employee) => employee.claims)
    employee: Employee;

    @ManyToOne(() => BenefitPackage, (pkg) => pkg.claims)
    benefitPackage: BenefitPackage;

    @ManyToOne(() => User, { nullable: true })
    reviewedBy: User;

}