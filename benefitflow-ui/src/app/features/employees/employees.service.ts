import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  Company,
  Employee,
  PaginatedData,
  PaginatedResponse,
  UserRole,
} from '../../shared/models';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface CreateEmployeePayload {
  firstName: string;
  email: string;
  jobTitle?: string;
  status?: string;
  companyId: number;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeesService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/employees`;

  getAll(
    page = 1,
    limit = 20,
    filters: Record<string, string> = {},
  ): Observable<PaginatedData<Employee>> {
    let params = new HttpParams().set('page', page).set('limit', limit);

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });

    return this.http
      .get<ApiResponse<PaginatedData<Employee>>>(this.url, { params })
      .pipe(map((r) => r.data));
  }

  create(data: CreateEmployeePayload) {
    return this.http.post<ApiResponse<Employee>>(this.url, data).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<CreateEmployeePayload>) {
    return this.http
      .patch<ApiResponse<Employee>>(`${this.url}/${id}`, data)
      .pipe(map((res) => res.data));
  }

  // HR manager — PATCH /employees/:id/role
  // Only accepts 'employee' | 'hr_manager', backend rejects 'admin'.
  updateRole(employeeId: number, role: 'employee' | 'hr_manager') {
    return this.http
      .patch<ApiResponse<Employee>>(`${this.url}/${employeeId}/role`, { role })
      .pipe(map((r) => r.data));
  }

  // Admin — PATCH /users/:id/role
  // Uses the user id (employee.user.id), not the employee id.
  // Accepts any role including 'admin'.
  updateUserRole(userId: number, role: UserRole) {
    return this.http
      .patch<
        ApiResponse<{ id: number; email: string; role: UserRole }>
      >(`${environment.apiUrl}/users/${userId}/role`, { role })
      .pipe(map((r) => r.data));
  }

  getMyCompany() {
    return this.http.get<ApiResponse<Company>>(`${this.url}/my-company`).pipe(map((r) => r.data));
  }

  getMyEmployees() {
    return this.http
      .get<ApiResponse<Employee[]>>(`${this.url}/my-employees`)
      .pipe(map((r) => r.data));
  }

  updateStatus(id: number, status: string) {
    return this.http
      .patch<ApiResponse<Employee>>(`${this.url}/${id}`, { status })
      .pipe(map((r) => r.data));
  }

  delete(id: number) {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.url}/${id}`)
      .pipe(map((res) => res.data));
  }
}
