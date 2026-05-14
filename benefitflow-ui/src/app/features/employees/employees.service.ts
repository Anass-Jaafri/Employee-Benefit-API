import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiResponse, Employee } from '../../shared/models';
import { map } from 'rxjs/operators';

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

  getAll() {
    return this.http.get<ApiResponse<Employee[]>>(this.url).pipe(
      map(res => res.data)
    );
  }

  create(data: CreateEmployeePayload) {

    return this.http.post<ApiResponse<Employee>>(this.url, data).pipe(
      map(res => res.data)
    );
  }

  update(id: number, data: Partial<CreateEmployeePayload>) {
    return this.http.patch<ApiResponse<Employee>>(`${this.url}/${id}`, data).pipe(
      map(res => res.data)
    );
  }

  delete(id: number) {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.url}/${id}`).pipe(
      map(res => res.data)
    );
  }
}
