import { Expose } from "class-transformer";
import { UserRole } from "../user.entity";

export class UserResponseDto {
    @Expose() id: number;
    @Expose() email: string;
    @Expose() role: UserRole;
}