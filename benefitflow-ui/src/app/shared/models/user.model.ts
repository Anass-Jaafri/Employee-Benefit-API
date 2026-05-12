export type UserRole = 'admin' | 'hr_manager' | 'employee';

export interface User {
    id: number;
    email: string;
    role: UserRole;
}