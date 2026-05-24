import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserRole } from '../users/user.entity';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => request?.cookies?.refresh_token ?? null,
            ]),
            secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
        });
    }

    validate(payload: { sub: number; email: string; role: UserRole }) {
        return { id: payload.sub, email: payload.email, role: payload.role };
    }
}