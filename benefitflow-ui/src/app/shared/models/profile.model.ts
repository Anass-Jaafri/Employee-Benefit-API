import { UserRole } from './user.model';
import { Company } from './company.model';

export interface Profile {
    id: number;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    jobTitle: string | null;
    status: string;
    company: Company | null;
}