import { plainToInstance, ClassConstructor } from 'class-transformer';

export function toDto<T>(cls: ClassConstructor<T>, plain: unknown): T {
    return plainToInstance(cls, plain, { excludeExtraneousValues: true });
}

export function toDtoArray<T>(cls: ClassConstructor<T>, plain: unknown[]): T[] {
    return plain.map(item => toDto(cls, item));
}