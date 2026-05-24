import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { ApiResponse, Company } from "../../shared/models";
import { map } from "rxjs/operators";

export interface CreateCompanyPayload {
    name: string;
    industry: string;
    employeeCount: number;
}

@Injectable({ providedIn: 'root' })
export class CompaniesService {
    private http = inject(HttpClient);
    private url = `${environment.apiUrl}/companies`;

    getAll() {
        return this.http.get<ApiResponse<Company[]>>(this.url).pipe(
            map(res => res.data)
        );
    }

    getMy() {
        return this.http.get<ApiResponse<Company>>(`${this.url}/my`).pipe(map(r => r.data));
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