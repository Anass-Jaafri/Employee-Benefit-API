import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class TrimStringsPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        if (metadata.type !== 'body') return value;
        return this.trimStrings(value);
    }

    private trimStrings(obj: any): any {
        if (typeof obj === 'string') return obj.trim();
        if (Array.isArray(obj)) return obj.map(v => this.trimStrings(v));
        if (obj !== null && typeof obj === 'object') {
            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k, this.trimStrings(v)]),
            );
        }
        return obj;
    }
}