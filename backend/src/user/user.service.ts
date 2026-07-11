// src/user/user.service.ts
import { Injectable, ConflictException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UserRole, UserStatus } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  private roleCodes: Record<string, string> = {
    'Admin': 'AD',
    'Director': 'D',
    'Regional Manager': 'RM',
    'Branch Manager': 'BM',
    'BDM': 'BD',
    'Sales Manager': 'SM',
  };

  private roleLevels: Record<string, number> = {
    'Admin': 0,
    'Director': 1,
    'Regional Manager': 2,
    'Branch Manager': 3,
    'BDM': 4,
    'Sales Manager': 5,
  };

  // ─── CREATE USER ────────────────────────────────────────────────
  async create(createUserDto: CreateUserDto, currentUser?: any) {
    const userCount = await this.prisma.user.count();
    const isFirstUser = userCount === 0;

    if (!isFirstUser && currentUser) {
      const creatableRoles = this.getCreatableRoles(currentUser.role);
      if (!creatableRoles.includes(createUserDto.role)) {
        throw new BadRequestException(
          `${currentUser.role} cannot create ${createUserDto.role} role`
        );
      }
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          { mobile: createUserDto.mobile },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or mobile already exists');
    }

    if (createUserDto.parentUserId) {
      const parent = await this.prisma.user.findUnique({
        where: { id: createUserDto.parentUserId },
      });

      if (!parent) {
        throw new NotFoundException('Reporting manager not found');
      }

      const parentLevel = this.roleLevels[parent.role];
      const userLevel = this.roleLevels[createUserDto.role];

      if (userLevel <= parentLevel) {
        throw new BadRequestException(
          `${parent.role} cannot be the reporting manager for ${createUserDto.role}`
        );
      }

      if (parent.status !== 'Active') {
        throw new BadRequestException('Reporting manager is not active');
      }
    }

    const roleCode = this.roleCodes[createUserDto.role];
    const existingCount = await this.prisma.user.count({
      where: { role: createUserDto.role },
    });
    const employeeCode = `${roleCode}${String(existingCount + 1).padStart(3, '0')}`;

    const hashedPin = await bcrypt.hash(createUserDto.pin, 10);

    const parentId = isFirstUser ? null : (createUserDto.parentUserId || currentUser?.id || null);
    const createdById = isFirstUser ? null : (currentUser?.id || null);

    const user = await this.prisma.user.create({
      data: {
        employeeCode,
        name: createUserDto.name,
        email: createUserDto.email,
        mobile: createUserDto.mobile,
        pin: hashedPin,
        role: createUserDto.role,
        fatherHusbandName: createUserDto.fatherHusbandName,
        address: createUserDto.address,
        dob: createUserDto.dob ? new Date(createUserDto.dob) : undefined,
        nomineeName: createUserDto.nomineeName,
        nomineeRelationship: createUserDto.nomineeRelationship,
        bankName: createUserDto.bankName,
        bankAccountNo: createUserDto.bankAccountNo,
        ifscCode: createUserDto.ifscCode,
        bankBranch: createUserDto.bankBranch,
        panNo: createUserDto.panNo,
        parentUserId: parentId,
        createdBy: createdById,
        status: 'Active',
      },
      include: {
        parent: true,
        children: true,
      },
    });

    // ─── Send WhatsApp Notification ──────────────────────────────
    try {
      const referredByName = user.parent?.name || 'System';
      await this.whatsappService.sendEmployeeRegistrationSuccess(
        user.mobile,
        user.name,
        user.employeeCode,
        user.role,
        referredByName,
      );
      this.logger.log(`WhatsApp notification sent to ${user.mobile} for ${user.name}`);
    } catch (error) {
      // Don't block user creation if WhatsApp fails
      this.logger.error(`WhatsApp notification failed for ${user.mobile}: ${error.message}`);
    }

    const { pin, ...result } = user;
    return result;
  }

  // ─── FIND ALL USERS ──────────────────────────────────────────────
  async findAll(role?: string, status?: string, search?: string, parentUserId?: number, currentUser?: any) {
    const where: any = {};

    if (role) where.role = role;
    if (status) where.status = status;
    if (parentUserId) where.parentUserId = parentUserId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    let users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        parent: true,
        children: true,
      },
    });

    if (currentUser && !['Admin', 'Director'].includes(currentUser?.role)) {
      const teamIds = await this.getTeamMembers(currentUser.id);
      users = users.filter((user) => user.id === currentUser.id || teamIds.includes(user.id));
    }

    return users.map(({ pin, ...user }) => user);
  }

  // ─── FIND ONE USER ───────────────────────────────────────────────
  async findOne(id: number, currentUser?: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          include: {
            children: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (currentUser && !['Admin', 'Director'].includes(currentUser?.role)) {
      const teamIds = await this.getTeamMembers(currentUser.id);
      if (user.id !== currentUser.id && !teamIds.includes(user.id)) {
        throw new BadRequestException('You do not have access to this user');
      }
    }

    const { pin, ...result } = user;
    return result;
  }

  // ─── FIND BY IDENTIFIER ──────────────────────────────────────────
  async findByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { employeeCode: identifier },
          { email: identifier },
          { mobile: identifier },
        ],
      },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  // ─── FIND BY ROLE ─────────────────────────────────────────────────
  async findByRole(role: string) {
    return this.prisma.user.findFirst({
      where: { role },
    });
  }

  // ─── UPDATE USER ──────────────────────────────────────────────────
  async update(id: number, updateUserDto: UpdateUserDto, currentUser?: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.role && currentUser && currentUser.role !== 'Admin') {
      throw new BadRequestException('Only Admin can change roles');
    }

    if (updateUserDto.parentUserId) {
      const parent = await this.prisma.user.findUnique({
        where: { id: updateUserDto.parentUserId },
      });

      if (!parent) {
        throw new NotFoundException('Parent user not found');
      }

      const parentLevel = this.roleLevels[parent.role];
      const userLevel = this.roleLevels[user.role];

      if (userLevel <= parentLevel) {
        throw new BadRequestException(
          `${parent.role} cannot be parent of ${user.role}`
        );
      }
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateUserDto.mobile && updateUserDto.mobile !== user.mobile) {
      const existing = await this.prisma.user.findUnique({
        where: { mobile: updateUserDto.mobile },
      });
      if (existing) {
        throw new ConflictException('Mobile already exists');
      }
    }

    const updateData: any = { ...updateUserDto };
    if (updateUserDto.dob) {
      updateData.dob = new Date(updateUserDto.dob);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        children: true,
      },
    });

    const { pin, ...result } = updatedUser;
    return result;
  }

  // ─── UPDATE PIN ────────────────────────────────────────────────────
  async updatePin(id: number, oldPin: string, newPin: string, currentUser?: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!['Admin', 'Director'].includes(currentUser?.role)) {
      if (user.id !== currentUser.id) {
        throw new BadRequestException('You can only update your own PIN');
      }
    }

    const isPinValid = await bcrypt.compare(oldPin, user.pin);
    if (!isPinValid) {
      throw new BadRequestException('Invalid current PIN');
    }

    const hashedNewPin = await bcrypt.hash(newPin, 10);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { pin: hashedNewPin },
      include: {
        parent: true,
        children: true,
      },
    });

    const { pin, ...result } = updatedUser;
    return result;
  }

  // ─── RESET PIN ─────────────────────────────────────────────────────
  async resetPin(id: number, newPin: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPin = await bcrypt.hash(newPin, 10);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { pin: hashedPin },
      include: {
        parent: true,
        children: true,
      },
    });

    const { pin, ...result } = updatedUser;
    return result;
  }

  // ─── UPDATE STATUS ────────────────────────────────────────────────
  async updateStatus(id: number, status: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status },
      include: {
        parent: true,
        children: true,
      },
    });

    const { pin, ...result } = updatedUser;
    return result;
  }

  // ─── DELETE USER ──────────────────────────────────────────────────
  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.children.length > 0) {
      throw new BadRequestException(
        `Cannot delete user with ${user.children.length} team member(s)`
      );
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  // ─── GET CREATABLE ROLES ─────────────────────────────────────────
  getCreatableRoles(currentUserRole: string): string[] {
    const roles = ['Admin', 'Director', 'Regional Manager', 'Branch Manager', 'BDM', 'Sales Manager'];
    const currentLevel = this.roleLevels[currentUserRole];

    if (currentLevel === undefined) {
      return [];
    }

    if (currentUserRole === 'Admin') {
      return roles.slice(1);
    }

    if (currentUserRole === 'Director') {
      return roles.slice(2);
    }

    return [];
  }

  // ─── GET HIERARCHY ─────────────────────────────────────────────────
  async getHierarchy(currentUser?: any) {
    if (['Admin', 'Director'].includes(currentUser?.role)) {
      const users = await this.prisma.user.findMany({
        where: {
          parentUserId: null,
        },
        include: {
          children: {
            include: {
              children: {
                include: {
                  children: {
                    include: {
                      children: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          { role: 'asc' },
          { name: 'asc' },
        ],
      });
      return users.map(({ pin, ...user }) => user);
    }

    const user = await this.findOne(currentUser.id);
    return [user];
  }

  // ─── GET TEAM ──────────────────────────────────────────────────────
  async getTeam(userId: number, currentUser?: any) {
    if (!['Admin', 'Director'].includes(currentUser?.role)) {
      const teamIds = await this.getTeamMembers(currentUser.id);
      if (userId !== currentUser.id && !teamIds.includes(userId)) {
        throw new BadRequestException('You do not have access to this team');
      }
    }
    return this.findAll(undefined, undefined, undefined, userId, currentUser);
  }

  // ─── GET TEAM MEMBERS ─────────────────────────────────────────────
  async getTeamMembers(userId: number): Promise<number[]> {
    const teamMembers: number[] = [];
    const queue = [userId];
    const visited = new Set<number>();

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const children = await this.prisma.user.findMany({
        where: { parentUserId: currentId },
        select: { id: true },
      });

      for (const child of children) {
        teamMembers.push(child.id);
        queue.push(child.id);
      }
    }

    return teamMembers;
  }

  // ─── SEARCH ────────────────────────────────────────────────────────
  async search(query: string, currentUser?: any) {
    return this.findAll(undefined, undefined, query, undefined, currentUser);
  }

  // ─── GET STATS ─────────────────────────────────────────────────────
  async getStats() {
    const total = await this.prisma.user.count();
    const active = await this.prisma.user.count({
      where: { status: 'Active' },
    });

    const roleCounts = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    return {
      total,
      active,
      inactive: total - active,
      roles: roleCounts.map((item) => ({
        role: item.role,
        count: item._count,
      })),
    };
  }
}