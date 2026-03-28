const { prisma } = require('../config/database');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

class TaskService {
  async findAll({ page = 1, limit = 10, status, priority, userId }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (userId) where.userId = userId;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    return task;
  }

  async create(data, userId) {
    const task = await prisma.task.create({
      data: {
        ...data,
        userId,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return task;
  }

  async update(id, data, userId, isAdmin) {
    const task = await this.findById(id);

    if (task.userId !== userId && !isAdmin) {
      throw new ForbiddenError('You can only update your own tasks');
    }

    const updated = await prisma.task.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return updated;
  }

  async delete(id, userId, isAdmin) {
    const task = await this.findById(id);

    if (task.userId !== userId && !isAdmin) {
      throw new ForbiddenError('You can only delete your own tasks');
    }

    await prisma.task.delete({ where: { id } });
  }
}

module.exports = new TaskService();
