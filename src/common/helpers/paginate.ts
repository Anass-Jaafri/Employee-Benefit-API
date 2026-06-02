// Helper that returns both the data and the pagination meta in one call.
// Used at the service layer — controllers just pass the DTO through.

import { Repository, FindManyOptions } from 'typeorm';

export interface PaginatedResult<T> {
    items: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export async function paginate<T extends Object>(
    repository: Repository<T>,
    options: FindManyOptions<T>,
    page: number = 1,
    limit: number = 20,
): Promise<PaginatedResult<T>> {
    const [items, total] = await repository.findAndCount({
        ...options,
        skip: (page - 1) * limit,
        take: limit,
    });

    return {
        items,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}