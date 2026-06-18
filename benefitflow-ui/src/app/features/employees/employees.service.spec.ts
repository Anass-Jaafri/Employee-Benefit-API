import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EmployeesService } from './employees.service';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/employees`;
const USERS_BASE = `${environment.apiUrl}/users`;

const mockPaginated = {
  success: true,
  data: {
    items: [
      { id: 1, firstName: 'Alice' },
      { id: 2, firstName: 'Bob' },
    ],
    meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
  },
};

describe('EmployeesService', () => {
  let service: EmployeesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EmployeesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EmployeesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── getAll() ────────────────────────────────────────────────────────────────
  describe('getAll()', () => {
    it('sends GET to /employees with default pagination', () => {
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

    it('passes search filter as query param', () => {
      service.getAll(1, 20, { search: 'alice' }).subscribe();
      const req = httpMock.expectOne((r) => r.url === BASE);
      expect(req.request.params.get('search')).toBe('alice');
      req.flush(mockPaginated);
    });

    it('passes status filter as query param', () => {
      service.getAll(1, 20, { status: 'active' }).subscribe();
      const req = httpMock.expectOne((r) => r.url === BASE);
      expect(req.request.params.get('status')).toBe('active');
      req.flush(mockPaginated);
    });

    it('omits empty filter values', () => {
      service.getAll(1, 20, { search: '', companyId: '3' }).subscribe();
      const req = httpMock.expectOne((r) => r.url === BASE);
      expect(req.request.params.has('search')).toBe(false);
      expect(req.request.params.get('companyId')).toBe('3');
      req.flush(mockPaginated);
    });
  });

  // ── create() ────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('sends POST to /employees with payload', () => {
      const payload = { firstName: 'Jane', email: 'jane@acme.com', companyId: 1 };
      let result: any;
      service.create(payload).subscribe((d) => (result = d));

      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, data: { id: 7, ...payload } });
      expect(result.id).toBe(7);
    });
  });

  // ── update() ────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('sends PATCH to /employees/:id with partial payload', () => {
      service.update(5, { jobTitle: 'Lead Engineer' }).subscribe();
      const req = httpMock.expectOne(`${BASE}/5`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ jobTitle: 'Lead Engineer' });
      req.flush({ success: true, data: { id: 5, jobTitle: 'Lead Engineer' } });
    });
  });

  // ── updateRole() ─────────────────────────────────────────────────────────────
  describe('updateRole()', () => {
    it('sends PATCH to /employees/:id/role', () => {
      service.updateRole(5, 'hr_manager').subscribe();
      const req = httpMock.expectOne(`${BASE}/5/role`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ role: 'hr_manager' });
      req.flush({ success: true, data: { id: 5 } });
    });
  });

  // ── updateUserRole() ─────────────────────────────────────────────────────────
  describe('updateUserRole()', () => {
    it('sends PATCH to /users/:id/role', () => {
      service.updateUserRole(20, 'admin').subscribe();
      const req = httpMock.expectOne(`${USERS_BASE}/20/role`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ role: 'admin' });
      req.flush({ success: true, data: { id: 20, role: 'admin' } });
    });
  });

  // ── updateStatus() ───────────────────────────────────────────────────────────
  describe('updateStatus()', () => {
    it('sends PATCH to /employees/:id with status', () => {
      service.updateStatus(3, 'inactive').subscribe();
      const req = httpMock.expectOne(`${BASE}/3`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'inactive' });
      req.flush({ success: true, data: { id: 3, status: 'inactive' } });
    });
  });

  // ── delete() ────────────────────────────────────────────────────────────────
  describe('delete()', () => {
    it('sends DELETE to /employees/:id', () => {
      service.delete(8).subscribe();
      const req = httpMock.expectOne(`${BASE}/8`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: { message: 'Deleted' } });
    });
  });

  // ── getMyCompany() ───────────────────────────────────────────────────────────
  describe('getMyCompany()', () => {
    it('sends GET to /employees/my-company', () => {
      service.getMyCompany().subscribe();
      const req = httpMock.expectOne(`${BASE}/my-company`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { id: 1, name: 'Acme' } });
    });
  });

  // ── getMyEmployees() ─────────────────────────────────────────────────────────
  describe('getMyEmployees()', () => {
    it('sends GET to /employees/my-employees', () => {
      service.getMyEmployees().subscribe();
      const req = httpMock.expectOne(`${BASE}/my-employees`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });
  });
});
