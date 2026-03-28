const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/errors');

class UserService {
  async findAll({ page = 1, limit = 10, search, role }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  async update(id, data) {
    await this.findById(id);

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async delete(id) {
    await this.findById(id);
    await prisma.user.delete({ where: { id } });
  }
}

module.exports = new UserService();
