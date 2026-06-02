import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiResponse, Claim, PaginatedData, PaginatedResponse } from '../../shared/models';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface CreateClaimPayload {
  title: string;
  description?: string;
  amount: number;
  claimType: string;
  attachmentUrl?: string;
  benefitPackageId: number;
}

export interface ReviewClaimPayload {
  status: string;
  rejectReason?: string;
}

export interface RemainigAmount {
  packageId: number;
  employeeId: number;
  maxBenefitAmount: number | null;
  committed: number;
  remainingAmount: number | null;
  note?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClaimsService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/claims`;

  getAll(
    page = 1,
    limit = 20,
    filters: Record<string, string> = {},
  ): Observable<PaginatedData<Claim>> {
    let params = new HttpParams().set('page', page).set('limit', limit);

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });

    return this.http
      .get<ApiResponse<PaginatedData<Claim>>>(this.url, { params })
      .pipe(map((r) => r.data));
  }

  getMyCompany(filters: Record<string, string> = {}): Observable<Claim[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });

    return this.http
      .get<ApiResponse<Claim[]>>(`${this.url}/my-company-claims`, { params })
      .pipe(map((r) => r.data));
  }

  getMy(): Observable<Claim[]> {
    return this.http.get<ApiResponse<Claim[]>>(`${this.url}/my-claims`).pipe(map((r) => r.data));
  }

  create(data: CreateClaimPayload) {
    return this.http.post<ApiResponse<Claim>>(this.url, data).pipe(map((res) => res.data));
  }

  review(id: number, data: ReviewClaimPayload) {
    return this.http
      .patch<ApiResponse<Claim>>(`${this.url}/${id}/review`, data)
      .pipe(map((res) => res.data));
  }

  getRemainingAmount(packageId: number, employeeId: number) {
    return this.http
      .get<ApiResponse<RemainigAmount>>(`${this.url}/remaining/${packageId}/${employeeId}`)
      .pipe(map((res) => res.data));
  }
}
