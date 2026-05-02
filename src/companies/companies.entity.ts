import { ApiHideProperty } from "@nestjs/swagger";
import { Column, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Company {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    industry: string;

    @Column()
    employeeCount: number;

    @ApiHideProperty()
    @DeleteDateColumn({ select: false })
    deletedAt: Date;

}