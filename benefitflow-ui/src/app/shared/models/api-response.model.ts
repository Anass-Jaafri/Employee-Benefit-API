export interface ApiResponse<T> {
    success: boolean;
    data: T;
    timestamp: string;
}

export interface PaginatedData<T> {
    items: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}


export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;