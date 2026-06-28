import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/create-test-app';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health → 200 with database status up', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    // TransformInterceptor wraps all responses: { data: { status, info, ... } }
    const body = res.body.data ?? res.body;
    expect(body.status).toBe('ok');
    expect(body.info.database.status).toBe('up');
  });
});
