import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserRole } from "src/users/user.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => request?.cookies?.access_token ?? null,
            ]),
            secretOrKey: config.get<string>('JWT_SECRET')!,
            ignoreExpiration: false,
        });
    }
    validate(payload: { sub: number, email: string, role: UserRole }) {
        return { id: payload.sub, email: payload.email, role: payload.role };
    }

}