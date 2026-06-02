import { ApiHideProperty } from "@nestjs/swagger";
import { BenefitPackage } from "../benefit-packages/benefit-package.entity";
import { Employee } from "../employees/employee.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Company {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column()
    industry: string;

    @Column()
    employeeCount: number;

    @Column({ type: 'varchar', nullable: true })
    domain: string | null;

    @ApiHideProperty()
    @DeleteDateColumn({ select: false })
    deletedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => Employee, (employee) => employee.company)
    employees: Employee[];

    @OneToMany(() => BenefitPackage, (pkg) => pkg.company)
    benefitPackages: BenefitPackage[];

}