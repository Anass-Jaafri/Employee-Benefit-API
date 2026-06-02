import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiResponse, BenefitPackage, PaginatedData, PaginatedResponse } from '../../shared/models';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface BenefitPackagesPayload {
  name: string;
  description?: string;
  isActive?: boolean;
  perks?: string[];
  maxBenefitAmount?: number;
  startDate?: string;
  endDate?: string;
  companyId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class BenefitPackagesService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/benefit-packages`;

  getAll(
    page = 1,
    limit = 20,
    filters: Record<string, string> = {},
  ): Observable<PaginatedData<BenefitPackage>> {
    let params = new HttpParams().set('page', page).set('limit', limit);

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });

    return this.http
      .get<ApiResponse<PaginatedData<BenefitPackage>>>(this.url, { params })
      .pipe(map((r) => r.data));
  }
  getMyBenefit() {
    return this.http
      .get<ApiResponse<BenefitPackage[]>>(`${this.url}/my-benefit`)
      .pipe(map((r) => r.data));
  }

  getMyCompanyBenefit() {
    return this.http
      .get<ApiResponse<BenefitPackage[]>>(`${this.url}/my-company-benefit`)
      .pipe(map((r) => r.data));
  }

  setActive(id: number, isActive: boolean) {
    return this.http
      .patch<ApiResponse<BenefitPackage>>(`${this.url}/${id}`, { isActive })
      .pipe(map((r) => r.data));
  }

  // Admin — requires companyId in payload
  create(data: BenefitPackagesPayload) {
    return this.http.post<ApiResponse<BenefitPackage>>(this.url, data).pipe(map((r) => r.data));
  }

  // HR manager — backend resolves company from JWT, no companyId needed
  createForMyCompany(data: Omit<BenefitPackagesPayload, 'companyId'>) {
    return this.http
      .post<ApiResponse<BenefitPackage>>(`${this.url}/my-company`, data)
      .pipe(map((r) => r.data));
  }

  enrollEmployee(packageId: number, employeeId: number) {
    return this.http
      .post<ApiResponse<{ message: string }>>(`${this.url}/${packageId}/enroll/${employeeId}`, {})
      .pipe(map((r) => r.data));
  }

  update(id: number, data: Partial<BenefitPackagesPayload>) {
    return this.http
      .patch<ApiResponse<BenefitPackagesPayload>>(`${this.url}/${id}`, data)
      .pipe(map((res) => res.data));
  }
  delete(id: number) {
    return this.http
      .delete<ApiResponse<{ message: string }>>(`${this.url}/${id}`)
      .pipe(map((res) => res.data));
  }
}
