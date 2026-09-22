import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ApiExceptionFilter } from './../src/common/http-exception.filter';

describe('MAC NATION API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new ApiExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ ok: true, name: 'api_mac_nation' });
  });

  it('/api/catalog/services (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/catalog/services')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((item: { id: string }) => item.id === 'combo')).toBe(
      true,
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
