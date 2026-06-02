import { Throttle, SkipThrottle } from '@nestjs/throttler';

// 5 login attempts per minute per IP
export const LoginThrottle = () =>
    Throttle({ default: { ttl: 60_000, limit: 5 } });

// 3 registration attempts per hour per IP
export const RegisterThrottle = () =>
    Throttle({ default: { ttl: 3_600_000, limit: 3 } });

// Re-export SkipThrottle for health checks or internal endpoints
export { SkipThrottle };