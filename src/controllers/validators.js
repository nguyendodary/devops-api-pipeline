const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid UUID format'),
  }),
});

const updateUserSchema = z.object({
  body: z
    .object({
      email: z.string().email('Invalid email format').optional(),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .optional(),
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    dueDate: z
      .string()
      .datetime({ offset: true })
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
  }),
});

const updateTaskSchema = z.object({
  body: z
    .object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).optional().nullable(),
      status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      dueDate: z
        .string()
        .datetime({ offset: true })
        .optional()
        .nullable()
        .transform((val) => {
          if (val === undefined) return undefined;
          if (val === null) return null;
          return new Date(val);
        }),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
  }),
});

const taskFilterSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  uuidParamSchema,
  updateUserSchema,
  createTaskSchema,
  updateTaskSchema,
  paginationSchema,
  taskFilterSchema,
};
