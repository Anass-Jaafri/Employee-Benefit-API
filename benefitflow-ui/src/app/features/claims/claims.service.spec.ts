import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ClaimsService } from './claims.service';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/claims`;

const mockPaginated = {
  success: true,
  data: {
    items: [{ id: 1 }, { id: 2 }],
    meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
  },
};

describe('ClaimsService', () => {
  let service: ClaimsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClaimsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClaimsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── getAll() ────────────────────────────────────────────────────────────────
  describe('getAll()', () => {
    it('sends GET to /claims with default pagination params', () => {
      service.getAll().subscribe();
      const req = httpMock.expectOne((r) => r.url === BASE);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('20');
      req.flush(mockPaginated);
    });

    it('returns unwrapped paginated data', () => {
      let result: any;
      service.getAll().subscribe((d) => (result = d));
      httpMock.expectOne((r) => r.url === BASE).flush(mockPaginated);
      expect(result.items).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('passes status filter as query param', () => {
      service.getAll(1, 20, { status: 'pending' }).subscribe();
      const req = httpMock.expectOne((r) => r.url === BASE);
      expect(req.request.params.get('status')).toBe('pending');
      req.flush(mockPaginated);
    });

    it('passes date-range filters', () => {
      service.getAll(1, 20, { fromDate: '2024-01-01', toDate: '2024-12-31' }).subscribe();
      const req = httpMock.expectOne((r) => r.url === BASE);
      expect(req.request.params.get('fromDate')).toBe('2024-01-01');
      expect(req.request.params.get('toDate')).toBe('2024-12-31');
      req.flush(mockPaginated);
    });

    it('omits empty filter values', () => {
      service.getAll(1, 20, { status: '', claimType: 'medical' }).subscribe();
      const req = httpMock.expectOne((r) => r.url === BASE);
      expect(req.request.params.has('status')).toBe(false);
      expect(req.request.params.get('claimType')).toBe('medical');
      req.flush(mockPaginated);
    });
  });

  // ── getMyCompany() ──────────────────────────────────────────────────────────
  describe('getMyCompany()', () => {
    it('sends GET to /claims/my-company-claims', () => {
      service.getMyCompany().subscribe();
      const req = httpMock.expectOne((r) => r.url === `${BASE}/my-company-claims`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

    it('passes filters as query params', () => {
      service.getMyCompany({ status: 'approved' }).subscribe();
      const req = httpMock.expectOne((r) => r.url === `${BASE}/my-company-claims`);
      expect(req.request.params.get('status')).toBe('approved');
      req.flush({ success: true, data: [] });
    });
  });

  // ── getMy() ─────────────────────────────────────────────────────────────────
  describe('getMy()', () => {
    it('sends GET to /claims/my-claims', () => {
      service.getMy().subscribe();
      const req = httpMock.expectOne(`${BASE}/my-claims`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });
  });

  // ── create() ────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('sends POST to /claims with payload', () => {
      const payload = { title: 'Gym', amount: 120, claimType: 'gym', benefitPackageId: 5 };
      let result: any;
      service.create(payload).subscribe((d) => (result = d));

      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, data: { id: 99, ...payload } });
      expect(result.id).toBe(99);
    });
  });

  // ── review() ────────────────────────────────────────────────────────────────
  describe('review()', () => {
    it('sends PATCH to /claims/:id/review', () => {
      service.review(10, { status: 'approved' }).subscribe();
      const req = httpMock.expectOne(`${BASE}/10/review`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'approved' });
      req.flush({ success: true, data: { id: 10, status: 'approved' } });
    });
  });

  // ── getRemainingAmount() ─────────────────────────────────────────────────────
  describe('getRemainingAmount()', () => {
    it('sends GET to /claims/remaining/:packageId/:employeeId', () => {
      let result: any;
      service.getRemainingAmount(7, 42).subscribe((d) => (result = d));
      const req = httpMock.expectOne(`${BASE}/remaining/7/42`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { remainingAmount: 380, committed: 120 } });
      expect(result.remainingAmount).toBe(380);
    });
  });
});
