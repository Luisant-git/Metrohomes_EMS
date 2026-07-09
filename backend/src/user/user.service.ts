// src/user/user.service.ts
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UserRole, UserStatus } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private roleCodes: Record<string, string> = {
    [UserRole.ADMIN]: 'AD',
    [UserRole.DIRECTOR]: 'D',
    [UserRole.REGIONAL_MANAGER]: 'RM',
    [UserRole.BRANCH_MANAGER]: 'BM',
    [UserRole.BDM]: 'BD',
    [UserRole.SALES_MANAGER]: 'SM',
  };

  private roleLevels: Record<string, number> = {
    [UserRole.ADMIN]: 0,
    [UserRole.DIRECTOR]: 1,
    [UserRole.REGIONAL_MANAGER]: 2,
    [UserRole.BRANCH_MANAGER]: 3,
    [UserRole.BDM]: 4,
    [UserRole.SALES_MANAGER]: 5,
  };

  // ─── CREATE USER ────────────────────────────────────────────────
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
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
        parentUserId: createUserDto.parentUserId,
        createdBy: createUserDto.createdBy,
        status: 'Active',
      },
      include: {
        parent: true,
        children: true,
      },
    });

    const { pin, ...result } = user;
    return result as UserResponseDto;
  }

  // ─── FIND BY IDENTIFIER ──────────────────────────────────────────
  async findByIdentifier(identifier: string): Promise<any> {
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

  // ─── FIND ALL USERS ──────────────────────────────────────────────
  async findAll(params?: {
    role?: string;
    status?: string;
    search?: string;
    parentUserId?: string;
  }): Promise<UserResponseDto[]> {
    const where: any = {};

    if (params?.role) where.role = params.role;
    if (params?.status) where.status = params.status;
    if (params?.parentUserId) where.parentUserId = params.parentUserId;

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { mobile: { contains: params.search } },
        { employeeCode: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        parent: true,
        children: true,
      },
    });

    return users.map(({ pin, ...user }) => user as UserResponseDto);
  }

  // ─── FIND ONE USER ───────────────────────────────────────────────
  async findOne(id: string): Promise<UserResponseDto> {
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

    const { pin, ...result } = user;
    return result as UserResponseDto;
  }

  // ─── FIND BY ROLE ─────────────────────────────────────────────────
  async findByRole(role: string): Promise<any> {
    return this.prisma.user.findFirst({
      where: { role },
    });
  }

  // ─── UPDATE USER ──────────────────────────────────────────────────
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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
    return result as UserResponseDto;
  }

  // ─── UPDATE PIN ────────────────────────────────────────────────────
  async updatePin(id: string, oldPin: string, newPin: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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
    return result as UserResponseDto;
  }

  // ─── RESET PIN ─────────────────────────────────────────────────────
  async resetPin(id: string, newPin: string): Promise<UserResponseDto> {
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
    return result as UserResponseDto;
  }

  // ─── UPDATE STATUS ────────────────────────────────────────────────
  async updateStatus(id: string, status: UserStatus): Promise<UserResponseDto> {
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
    return result as UserResponseDto;
  }

  // ─── DELETE USER ──────────────────────────────────────────────────
  async remove(id: string): Promise<void> {
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
  async getCreatableRoles(currentUserRole: string): Promise<string[]> {
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

  // ─── GET DOWNLINE ──────────────────────────────────────────────────
  async getDownline(parentId: string): Promise<UserResponseDto[]> {
    const users: any[] = [];
    const queue = [parentId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      const children = await this.prisma.user.findMany({
        where: { parentUserId: currentId },
      });

      for (const child of children) {
        users.push(child);
        queue.push(child.id);
      }
    }

    return users.map(({ pin, ...user }) => user as UserResponseDto);
  }

  // ─── GET HIERARCHY ─────────────────────────────────────────────────
  async getHierarchy(): Promise<UserResponseDto[]> {
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

    return users.map(({ pin, ...user }) => user as UserResponseDto);
  }

  // ─── GET TEAM MEMBERS ─────────────────────────────────────────────
  async getTeamMembers(userId: string): Promise<string[]> {
    const teamMembers: string[] = [];
    const queue = [userId];
    const visited = new Set<string>();

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