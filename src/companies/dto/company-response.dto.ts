import { Expose } from "class-transformer";

export class CompanyResponseDto {
    @Expose() id: number;
    @Expose() name: string;
    @Expose() industry: string;
    @Expose() employeeCount: number;
    @Expose() createdAt: Date;
    @Expose() isActive: boolean;
}