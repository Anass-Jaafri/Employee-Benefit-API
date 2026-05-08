import { ApiHideProperty } from "@nestjs/swagger";
import { BenefitPackage } from "src/benefit-packages/benefit-package.entity";
import { Claim } from "src/claims/claim.entity";
import { Company } from "src/companies/companies.entity";
import { User } from "src/users/user.entity";
import {
    Column,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn
} from "typeorm";

export enum EmploymentStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    ON_LEAVE = 'on_leave',
}

@Entity()
export class Employee {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    jobTitle: string;

    @Column({ type: 'enum', enum: EmploymentStatus, default: EmploymentStatus.ACTIVE })
    status: EmploymentStatus;

    @ManyToOne(() => Company, (company) => company.employees, {
        onDelete: 'CASCADE',
    })

    company: Company;

    @ApiHideProperty()
    @DeleteDateColumn({ select: false })
    deletedAt: Date;

    @ManyToMany(() => BenefitPackage, (pkg) => pkg.employees)
    @JoinTable()
    benefitPackages: BenefitPackage[];

    @OneToMany(() => Claim, (claim) => claim.employee)
    claims: Claim[];
    @OneToOne(() => User, { nullable: true })
    @JoinColumn()
    user: User;

}