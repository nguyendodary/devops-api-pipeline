const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/database');

beforeAll(async () => {
  await prisma.$connect();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('Health Check', () => {
  it('GET / should return API status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /health should return health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.database).toBe('connected');
  });
});

describe('Authentication', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Test1234',
    firstName: 'Test',
    lastName: 'User',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should not register duplicate email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('Email already registered');
    });

    it('should validate required fields', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ email: 'bad' });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPass1' });
      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'Test1234' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      token = res.body.data.accessToken;
    });

    it('should return user profile with valid token', async () => {
      const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });
  });
});

describe('Tasks CRUD', () => {
  let token;
  let taskId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Test1234' });
    token = res.body.data.accessToken;
  });

  it('POST /api/v1/tasks - should create a task', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Task', description: 'A test task', priority: 'HIGH' });
    expect(res.status).toBe(201);
    expect(res.body.data.task.title).toBe('Test Task');
    taskId = res.body.data.task.id;
  });

  it('GET /api/v1/tasks - should list tasks', async () => {
    const res = await request(app).get('/api/v1/tasks').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.pagination).toHaveProperty('total');
  });

  it('GET /api/v1/tasks/:id - should get task by id', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.task.id).toBe(taskId);
  });

  it('PATCH /api/v1/tasks/:id - should update task', async () => {
    const res = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'COMPLETED' });
    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe('COMPLETED');
  });

  it('DELETE /api/v1/tasks/:id - should delete task', async () => {
    const res = await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});

describe('404 handling', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.message).toContain('not found');
  });
});
