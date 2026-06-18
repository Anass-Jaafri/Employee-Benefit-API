import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BenefitPackagesService } from './benefit-packages.service';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/benefit-packages`;

const mockPaginated = {
  success: true,
  data: {
    items: [
      { id: 1, name: 'Health Plus' },
      { id: 2, name: 'Gym Pack' },
    ],
    meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
  },
};

describe('BenefitPackagesService', () => {
  let service: BenefitPackagesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BenefitPackagesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BenefitPackagesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── getAll() ────────────────────────────────────────────────────────────────
  describe('getAll()', () => {
    it('sends GET to /benefit-packages with default page and limit', () => {
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

    it('sends filter params when provided', () => {
      service.getAll(1, 20, { isActive: 'true' }).subscribe();
      const req = httpMock.expectOne((r) => r.url === BASE);
      expect(req.request.params.get('isActive')).toBe('true');
      req.flush(mockPaginated);
    });

    it('omits empty filter values', () => {
      service.getAll(1, 20, { isActive: '', companyId: '5' }).subscribe();
      const req = httpMock.expectOne((r) => r.url === BASE);
      expect(req.request.params.has('isActive')).toBe(false);
      expect(req.request.params.get('companyId')).toBe('5');
      req.flush(mockPaginated);
    });
  });

  // ── create() ────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('sends POST to /benefit-packages with payload', () => {
      const payload = { name: 'Dental', companyId: 3 };
      let result: any;
      service.create(payload).subscribe((d) => (result = d));

      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, data: { id: 10, ...payload } });
      expect(result.id).toBe(10);
    });
  });

  // ── createForMyCompany() ────────────────────────────────────────────────────
  describe('createForMyCompany()', () => {
    it('sends POST to /benefit-packages/my-company', () => {
      const payload = { name: 'Wellness' };
      service.createForMyCompany(payload).subscribe();

      const req = httpMock.expectOne(`${BASE}/my-company`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, data: { id: 5, ...payload } });
    });
  });

  // ── enrollEmployee() ────────────────────────────────────────────────────────
  describe('enrollEmployee()', () => {
    it('sends POST to /benefit-packages/:id/enroll/:employeeId', () => {
      service.enrollEmployee(7, 42).subscribe();
      const req = httpMock.expectOne(`${BASE}/7/enroll/42`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { message: 'Employee enrolled successfully' } });
    });
  });

  // ── update() ────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('sends PATCH to /benefit-packages/:id', () => {
      service.update(3, { name: 'Updated Name' }).subscribe();
      const req = httpMock.expectOne(`${BASE}/3`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ name: 'Updated Name' });
      req.flush({ success: true, data: { name: 'Updated Name' } });
    });
  });

  // ── delete() ────────────────────────────────────────────────────────────────
  describe('delete()', () => {
    it('sends DELETE to /benefit-packages/:id', () => {
      service.delete(3).subscribe();
      const req = httpMock.expectOne(`${BASE}/3`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: { message: 'Deleted' } });
    });
  });

  // ── setActive() ─────────────────────────────────────────────────────────────
  describe('setActive()', () => {
    it('sends PATCH with isActive flag', () => {
      service.setActive(4, false).subscribe();
      const req = httpMock.expectOne(`${BASE}/4`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ isActive: false });
      req.flush({ success: true, data: {} });
    });
  });
});
