import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    protected async getErrorMessage(): Promise<string> {
        return 'Too many requests — please slow down and try again shortly.';
    }
}