import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { ApiResponse, Company } from "../../shared/models";
import { map } from "rxjs/operators";

@Injectable({ providedIn: 'root' })
export class CompaniesService {
    private http = inject(HttpClient);
    private url = `${environment.apiUrl}/companies`;

    getAll() {
        return this.http.get<ApiResponse<Company[]>>(this.url).pipe(
            map(res => res.data)
        );
    }

    create(data: Omit<Company, 'id'>) {
        return this.http.post<ApiResponse<Company>>(this.url, data).pipe(
            map(res => res.data)
        );
    }

    update(id: number, data: Partial<Omit<Company, 'id'>>) {
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