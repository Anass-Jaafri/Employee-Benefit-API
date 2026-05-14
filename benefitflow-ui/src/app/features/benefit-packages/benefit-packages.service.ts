import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiResponse, BenefitPackage } from '../../shared/models';
import { map } from 'rxjs/operators';

export interface BenefitPackagesPayload {
  name: string;
  description?: string;
  isActive?: boolean;
  perks?: string[];
  maxBenefitAmount?: number;
  startDate?: string;
  endDate?: string;
  companyId: number;
}

@Injectable({
  providedIn: 'root',
})
export class BenefitPackagesService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/benefit-packages`;

  getAll() {
    return this.http.get<ApiResponse<BenefitPackage[]>>(this.url).pipe(
      map(res => res.data)
    );
  }

  create(data: BenefitPackagesPayload) {
    return this.http.post<ApiResponse<BenefitPackagesPayload>>(this.url, data).pipe(
      map(res => res.data)
    );
  }

  update(id: number, data: Partial<BenefitPackagesPayload>) {
    return this.http.patch<ApiResponse<BenefitPackagesPayload>>(`${this.url}/${id}`, data).pipe(
      map(res => res.data)
    );
  }
  delete(id: number) {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.url}/${id}`).pipe(
      map(res => res.data)
    );
  }
}
