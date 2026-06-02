import { Expose } from "class-transformer";

export class CompanyResponseDto {
    @Expose() id: number;
    @Expose() name: string;
    @Expose() industry: string;
    @Expose() employeeCount: number;

    @Expose() domain: string | null;
    @Expose() isActive: boolean;
    @Expose() updatedAt: Date;
    @Expose() createdAt: Date;
}