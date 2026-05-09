import { ApiHideProperty } from "@nestjs/swagger";
import { BenefitPackage } from "src/benefit-packages/benefit-package.entity";
import { Employee } from "src/employees/employee.entity";
import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

    @ApiHideProperty()
    @DeleteDateColumn({ select: false })
    deletedAt: Date;

    @OneToMany(() => Employee, (employee) => employee.company)
    employees: Employee[];

    @OneToMany(() => BenefitPackage, (pkg) => pkg.company)
    benefitPackages: BenefitPackage[];

}