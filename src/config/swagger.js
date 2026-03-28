const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'DevOps API Pipeline',
    version: '1.0.0',
    description:
      'Production-ready REST API with JWT authentication, task management, and user management.',
  },
  servers: [{ url: '/', description: 'Current server' }],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          userId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/': {
      get: {
        tags: ['Health'],
        summary: 'API status',
        responses: {
          200: {
            description: 'API running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string' }, message: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check with DB status',
        responses: {
          200: { description: 'Healthy' },
          503: { description: 'Unhealthy' },
        },
      },
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Created' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and get tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/v1/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'New tokens' } },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'User profile' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/api/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (paginated)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['USER', 'ADMIN'] } },
        ],
        responses: { 200: { description: 'Users list' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/api/v1/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'User' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated' } },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 204: { description: 'Deleted' }, 403: { description: 'Forbidden' } },
      },
    },
    '/api/v1/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks (paginated)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
          },
          {
            name: 'priority',
            in: 'query',
            schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          },
        ],
        responses: { 200: { description: 'Tasks list' } },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a new task',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string' },
                  priority: { type: 'string' },
                  dueDate: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/api/v1/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get task by ID',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Task' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Tasks'],
        summary: 'Update task',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string' },
                  priority: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated' } },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete task',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 204: { description: 'Deleted' } },
      },
    },
  },
};

module.exports = swaggerDocument;
