import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiResponse, Claim } from '../../shared/models';
import { map } from 'rxjs/operators';

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

  getAll() {
    return this.http.get<ApiResponse<Claim[]>>(this.url).pipe(map((res) => res.data));
  }

  getMy() {
    return this.http.get<ApiResponse<Claim[]>>(`${this.url}/my-claims`).pipe(
      map(res => res.data)
    );
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
