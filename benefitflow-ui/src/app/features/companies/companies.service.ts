import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { ApiResponse, Company, PaginatedData, PaginatedResponse } from "../../shared/models";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";

export interface CreateCompanyPayload {
    name: string;
    industry: string;
    employeeCount: number;
}

@Injectable({ providedIn: 'root' })
export class CompaniesService {
    private http = inject(HttpClient);
    private url = `${environment.apiUrl}/companies`;

    getAll(page = 1, limit = 20): Observable<PaginatedData<Company>> {
        return this.http.get<PaginatedResponse<Company>>(`${this.url}?page=${page}&limit=${limit}`).pipe(
            map(res => res.data)
        );
    }



    setActive(id: number, isActive: boolean) {
        return this.http.patch<ApiResponse<Company>>(`${this.url}/${id}`, { isActive }).pipe(map(r => r.data));
    }

    create(data: CreateCompanyPayload) {
        return this.http.post<ApiResponse<Company>>(this.url, data).pipe(
            map(res => res.data)
        );
    }

    update(id: number, data: CreateCompanyPayload) {
        return this.http.patch<ApiResponse<Company>>(`${this.url}/${id}`, data).pipe(
            map(res => res.data)
        );
    }

    delete(id: number) {
        return this.http.delete<ApiResponse<{ message: string }>>(`${this.url}/${id}`).pipe(
            map(res => res.data)
        );
    }
}