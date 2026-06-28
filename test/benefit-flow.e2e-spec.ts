import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from './helpers/create-test-app';

/**
 * Benefit Flow E2E Tests
 * ----------------------
 * Validates the complete HR benefit lifecycle through the real HTTP stack:
 *
 *   1. Admin registers → promoted to admin via DataSource
 *   2. Admin creates a company with a domain
 *   3. HR registers (same domain → auto-assigned to company) → promoted to hr_manager
 *   4. Employee registers (same domain → auto-assigned to same company)
 *   5. HR creates a benefit package for their company
 *   6. HR enrolls the employee in the package
 *   7. Employee submits a claim against the package
 *   8. HR approves the claim
 *   9. Employee verifies the claim is approved
 *  10. Role enforcement — employee cannot perform HR/Admin actions
 */

function getCookies(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

describe('Benefit Flow (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;

  let adminCookies: string[];
  let hrCookies: string[];
  let employeeCookies: string[];
  let companyId: number;
  let packageId: number;
  let employeeRecordId: number;
  let claimId: number;

  const DOMAIN = 'flowcorp-e2e.com';

  beforeAll(async () => {
    ({ app, dataSource: ds } = await createTestApp());

    // ── Seed admin ────────────────────────────────────────────────────────────
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        firstName: 'Super',
        lastName: 'Admin',
        email: `admin@${DOMAIN}`,
        password: 'Password123',
      })
      .expect(201);

    // Static import used at top — ds is already available here
    await ds.query(
      `UPDATE "user" SET role = 'admin' WHERE email = 'admin@${DOMAIN}'`,
    );

    const adminLogin = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: `admin@${DOMAIN}`, password: 'Password123' });
    adminCookies = getCookies(adminLogin.headers['set-cookie']);

    // ── Admin creates company ────────────────────────────────────────────────
    const companyRes = await request(app.getHttpServer())
      .post('/v1/companies')
      .set('Cookie', adminCookies)
      .send({
        name: 'FlowCorp E2E',
        industry: 'Technology',
        domain: DOMAIN,
        employeeCount: 50,
      })
      .expect(201);
    companyId = companyRes.body.data.id;

    // ── Seed HR ──────────────────────────────────────────────────────────────
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        firstName: 'HR',
        lastName: 'Manager',
        email: `hr@${DOMAIN}`,
        password: 'Password123',
      })
      .expect(201);

    await ds.query(
      `UPDATE "user" SET role = 'hr_manager' WHERE email = 'hr@${DOMAIN}'`,
    );

    const hrLogin = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: `hr@${DOMAIN}`, password: 'Password123' });
    hrCookies = getCookies(hrLogin.headers['set-cookie']);

    // ── Seed Employee ────────────────────────────────────────────────────────
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Employee',
        email: `emp@${DOMAIN}`,
        password: 'Password123',
      })
      .expect(201);

    const empLogin = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: `emp@${DOMAIN}`, password: 'Password123' });
    employeeCookies = getCookies(empLogin.headers['set-cookie']);
  });

  afterAll(async () => {
    await app.close();
  });

  // ── 1. Benefit Package ───────────────────────────────────────────────────────

  describe('Benefit Package', () => {
    it('HR can create a benefit package for their company', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/benefit-packages/my-company')
        .set('Cookie', hrCookies)
        .send({
          name: 'Gold Health Plan',
          description: 'Full medical + gym coverage',
          maxBenefitAmount: 5000,
          perks: ['health_insurance', 'gym_membership'],
          isActive: true,
        })
        .expect(201);

      packageId = res.body.data.id;
      expect(packageId).toBeDefined();
      expect(res.body.data.name).toBe('Gold Health Plan');
    });

    it('403 — employee cannot create a benefit package', () => {
      return request(app.getHttpServer())
        .post('/v1/benefit-packages/my-company')
        .set('Cookie', employeeCookies)
        .send({ name: 'Rogue Plan', maxBenefitAmount: 9999 })
        .expect(403);
    });

    it('HR can list their company packages', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/benefit-packages/my-company-benefit')
        .set('Cookie', hrCookies)
        .expect(200);

      const packages: any[] = res.body.data;
      expect(packages.some((p) => p.id === packageId)).toBe(true);
    });
  });

  // ── 2. Employee Enrollment ───────────────────────────────────────────────────

  describe('Employee Enrollment', () => {
    it('HR can look up the employee record id', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/employees/my-employees')
        .set('Cookie', hrCookies)
        .expect(200);

      const emp = res.body.data.find((e: any) => e.email === `emp@${DOMAIN}`);
      expect(emp).toBeDefined();
      employeeRecordId = emp.id;
    });

    it('HR can enroll the employee in the benefit package', async () => {
      await request(app.getHttpServer())
        .post(`/v1/benefit-packages/${packageId}/enroll/${employeeRecordId}`)
        .set('Cookie', hrCookies)
        .expect(201);
    });

    it('Employee can see their enrolled package', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/benefit-packages/my-benefit')
        .set('Cookie', employeeCookies)
        .expect(200);

      const enrolled = res.body.data.find((p: any) => p.id === packageId);
      expect(enrolled).toBeDefined();
    });
  });

  // ── 3. Claim Submission ──────────────────────────────────────────────────────

  describe('Claim Submission', () => {
    it('Employee can submit a claim against the package', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/claims')
        .set('Cookie', employeeCookies)
        .send({
          title: 'Dental Checkup',
          description: 'Annual dental cleaning',
          amount: 200,
          claimType: 'medical',
          benefitPackageId: packageId,
        })
        .expect(201);

      claimId = res.body.data.id;
      expect(claimId).toBeDefined();
      expect(res.body.data.status).toBe('pending');
    });

    it('Employee can see the claim in their claims list', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/claims/my-claims')
        .set('Cookie', employeeCookies)
        .expect(200);

      const claim = res.body.data.find((c: any) => c.id === claimId);
      expect(claim).toBeDefined();
      expect(claim.status).toBe('pending');
    });

    it('HR can see the claim in their company claims', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/claims/my-company-claims')
        .set('Cookie', hrCookies)
        .expect(200);

      const items: any[] = res.body.data?.items ?? res.body.data;
      const claim = items.find((c: any) => c.id === claimId);
      expect(claim).toBeDefined();
    });
  });

  // ── 4. Claim Review ──────────────────────────────────────────────────────────

  describe('Claim Review', () => {
    it('HR can approve the claim', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/claims/${claimId}/review`)
        .set('Cookie', hrCookies)
        .send({ status: 'approved' })
        .expect(200);

      expect(res.body.data.status).toBe('approved');
    });

    it('Employee can see the claim is now approved', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/claims/my-claims')
        .set('Cookie', employeeCookies)
        .expect(200);

      const claim = res.body.data.find((c: any) => c.id === claimId);
      expect(claim.status).toBe('approved');
    });

    it('HR can reject a second claim with a reason', async () => {
      const newClaimRes = await request(app.getHttpServer())
        .post('/v1/claims')
        .set('Cookie', employeeCookies)
        .send({
          title: 'Gym Membership',
          amount: 100,
          claimType: 'gym',
          benefitPackageId: packageId,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/v1/claims/${newClaimRes.body.data.id}/review`)
        .set('Cookie', hrCookies)
        .send({ status: 'rejected', rejectionReason: 'Missing receipt' })
        .expect(200);

      expect(res.body.data.status).toBe('rejected');
    });
  });

  // ── 5. Role Enforcement ──────────────────────────────────────────────────────

  describe('Role enforcement', () => {
    it('403 — employee cannot review claims', () => {
      return request(app.getHttpServer())
        .patch(`/v1/claims/${claimId}/review`)
        .set('Cookie', employeeCookies)
        .send({ status: 'approved' })
        .expect(403);
    });

    it('403 — employee cannot list all companies', () => {
      return request(app.getHttpServer())
        .get('/v1/companies')
        .set('Cookie', employeeCookies)
        .expect(403);
    });

    it('401 — unauthenticated request to any protected route', () => {
      return request(app.getHttpServer())
        .get('/v1/claims/my-claims')
        .expect(401);
    });
  });
});
