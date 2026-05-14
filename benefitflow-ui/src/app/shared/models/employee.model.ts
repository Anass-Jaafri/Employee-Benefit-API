import { Company } from "./company.model";

export type EmploymentStatus = 'active' | 'inactive' | 'on_leave';

export interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string | null;
    status: EmploymentStatus;
    company: Company;
}