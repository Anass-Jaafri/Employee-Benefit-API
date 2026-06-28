import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/create-test-app';

function getCookies(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Registration ─────────────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('201 — registers a new user and returns a success message', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'alice@acme-e2e.com',
          password: 'Password123',
        })
        .expect(201);

      expect(res.body.data.message).toBe('User registered successfully');
      expect(res.body.data.userId).toBeDefined();
    });

    it('409 — duplicate email returns Conflict', async () => {
      const payload = {
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'dup@acme-e2e.com',
        password: 'Password123',
      };
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(payload)
        .expect(201);
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(payload)
        .expect(409);
    });

    it('400 — missing required fields returns Bad Request', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'incomplete@test.com' })
        .expect(400);
    });
  });

  // ── Login ─────────────────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    const EMAIL = 'login-test@acme-e2e.com';
    const PASSWORD = 'Password123';

    beforeAll(async () => {
      await request(app.getHttpServer()).post('/v1/auth/register').send({
        firstName: 'Login',
        lastName: 'User',
        email: EMAIL,
        password: PASSWORD,
      });
    });

    it('201 — valid credentials set httpOnly access_token cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: EMAIL, password: PASSWORD })
        .expect(201);

      const cookies = getCookies(res.headers['set-cookie'] ?? []);
      expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
    });

    it('201 — response body contains user with role', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: EMAIL, password: PASSWORD })
        .expect(201);

      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.role).toBeDefined();
    });

    it('401 — wrong password returns Unauthorized', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: EMAIL, password: 'WrongPass999' })
        .expect(401);
    });

    it('401 — unknown email returns Unauthorized', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'ghost@nobody.com', password: PASSWORD })
        .expect(401);
    });
  });

  // ── Protected routes ──────────────────────────────────────────────────────────

  describe('Protected routes', () => {
    let cookies: string[];

    beforeAll(async () => {
      const EMAIL = 'protected@acme-e2e.com';
      await request(app.getHttpServer()).post('/v1/auth/register').send({
        firstName: 'Protected',
        lastName: 'User',
        email: EMAIL,
        password: 'Password123',
      });

      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: EMAIL, password: 'Password123' });

      cookies = getCookies(loginRes.headers['set-cookie']);
    });

    it('200 — authenticated user can reach GET /auth/profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/auth/profile')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.data.email).toBe('protected@acme-e2e.com');
    });

    it('200 — GET /auth/me returns id, email and role', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.email).toBeDefined();
      expect(res.body.data.role).toBeDefined();
    });

    it('401 — unauthenticated request to /auth/profile is rejected', () => {
      return request(app.getHttpServer()).get('/v1/auth/profile').expect(401);
    });
  });

  // ── Logout ────────────────────────────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    it('201 — clears the access_token cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .expect(201);

      const setCookie = getCookies(res.headers['set-cookie'] ?? []);
      const accessCookie = setCookie.find((c) => c.startsWith('access_token='));
      expect(accessCookie).toBeDefined();
      // Cleared cookies have Expires set to epoch
      expect(accessCookie).toMatch(/Expires=Thu, 01 Jan 1970/i);
    });
  });

  // ── Account Lockout ───────────────────────────────────────────────────────

  describe('Account lockout', () => {
    const EMAIL = 'lockout-test@acme-e2e.com';
    const PASSWORD = 'Password123';

    beforeAll(async () => {
      await request(app.getHttpServer()).post('/v1/auth/register').send({
        firstName: 'Lock',
        lastName: 'Test',
        email: EMAIL,
        password: PASSWORD,
      });
    });

    it('429 — account locks after 5 consecutive wrong passwords', async () => {
      // Fire 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/v1/auth/login')
          .send({ email: EMAIL, password: 'WrongPass!' });
      }

      // 6th attempt — account is now locked regardless of correct password
      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: EMAIL, password: PASSWORD })
        .expect(429);

      expect(res.body.message).toMatch(/locked/i);
    });
  });

  // ── Domain matching ───────────────────────────────────────────────────────────

  describe('Domain matching on register', () => {
    it('two users with the same email domain register without error', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          firstName: 'HR',
          lastName: 'One',
          email: 'hr1@domain-test.com',
          password: 'Password123',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          firstName: 'Emp',
          lastName: 'One',
          email: 'emp1@domain-test.com',
          password: 'Password123',
        })
        .expect(201);
    });
  });
});
