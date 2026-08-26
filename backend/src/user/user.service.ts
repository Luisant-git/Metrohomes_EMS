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

  // A user is auto-inactivated only when BOTH activities
  // (create a subordinate user, book a customer) are missing
  // for this many consecutive days. Enforced by the daily
  // cron job (UserInactivityScheduler), not on API requests.
  // Configurable via USER_INACTIVITY_DAYS (defaults to 90).
  private readonly INACTIVITY_DAYS: number;

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {
    const envDays = Number(process.env.USER_INACTIVITY_DAYS);
    this.INACTIVITY_DAYS = Number.isInteger(envDays) && envDays > 0 ? envDays : 90;
  }


     private async generateEmployeeCode(role: string): Promise<string> {
  const roleCode = this.roleCodes[role];

  while (true) {
    // Random 5-digit number (10000 - 99999)
    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    const employeeCode = `${roleCode}${randomNumber}`;

    const existingUser = await this.prisma.user.findUnique({
      where: {
        employeeCode,
      },
    });

    if (!existingUser) {
      return employeeCode;
    }
  }
}

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


const employeeCode = await this.generateEmployeeCode(createUserDto.role);

    // If PIN is provided, hash it; otherwise generate a temporary 4‑digit PIN for backend purposes
    const pinValue = createUserDto.pin ?? Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await bcrypt.hash(pinValue, 10);
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
        jobType: createUserDto.jobType,
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
        avatar: createUserDto.avatar,
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
      this.logger.error(`WhatsApp notification failed for ${user.mobile}: ${(error as Error).message}`);
    }

    const { pin, ...result } = user;

    // Rule 3 — Activity: creator created a subordinate user.
    // Record lastActivityAt (restarts the 90-day window) and keep them Active.
    if (currentUser?.id) {
      await this.prisma.user.update({
        where: { id: currentUser.id },
        data: { status: 'Active', lastActivityAt: new Date() },
      });
    }

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
    });

    if (currentUser && !['Admin', 'Director'].includes(currentUser?.role)) {
      const teamIds = await this.getTeamMembers(currentUser.id);
      users = users.filter((user) => user.id === currentUser.id || teamIds.includes(user.id));
    }

    // ─── Inactivity display fields ────────────────────────────────
    // Status transitions are handled ONLY by the daily cron job
    // (UserInactivityScheduler) to avoid extra DB queries per request.
    // Here we just annotate the response with read-only info derived
    // from the persisted activity fields.
    const cutoff = this.getInactivityCutoff();
    const referenceDate = (u: any): Date | null => {
      const candidates = [u.lastActivityAt, u.reactivatedAt, u.createdAt].filter(Boolean);
      return candidates.length ? new Date(Math.max(...candidates.map((d: Date) => d.getTime()))) : null;
    };

    return users.map(({ pin, ...user }) => {
      const ref = referenceDate(user);
      const daysInactive = ref ? Math.max(0, Math.floor((Date.now() - ref.getTime()) / 86400000)) : 0;
      const autoInactive = user.status === 'Inactive' && (!ref || ref < cutoff);
      return {
        ...user,
        lastActivityAt: ref ? ref.toISOString() : null,
        daysInactive,
        autoInactive,
      };
    });
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

  // Find user by mobile number (no auth checks)
  async findOneByMobile(mobile: string) {
    const user = await this.prisma.user.findUnique({
      where: { mobile },
    });
    return user;
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
    // If pin is explicitly set to null, remove it to satisfy Prisma non‑null constraint
    if (updateData.pin === null) {
      delete updateData.pin;
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
    const allUsers = await this.prisma.user.findMany({
      select: { id: true, parentUserId: true },
    });
    
    const byParent = new Map<number, number[]>();
    for (const u of allUsers) {
      if (u.parentUserId) {
        const arr = byParent.get(u.parentUserId) || [];
        arr.push(u.id);
        byParent.set(u.parentUserId, arr);
      }
    }

    const teamMembers: number[] = [];
    const queue = [userId];
    const visited = new Set<number>();

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const childrenIds = byParent.get(currentId) || [];
      for (const childId of childrenIds) {
        teamMembers.push(childId);
        queue.push(childId);
      }
    }

    return teamMembers;
  }

  // ─── INACTIVITY HELPERS ────────────────────────────────────────────
  private getInactivityCutoff(now: Date = new Date()): Date {
    return new Date(now.getTime() - this.INACTIVITY_DAYS * 24 * 60 * 60 * 1000);
  }

  // Returns the latest activity date (created a subordinate OR booked a customer)
  // for each given user id. Users with no activity are not present in the map.
  private async getLastActivityByUser(userIds: number[]): Promise<Map<number, Date>> {
    const ids = userIds.filter((id) => id != null);
    const map = new Map<number, Date>();
    if (ids.length === 0) return map;

    const consider = (uid: number, date: Date) => {
      if (uid == null || !date) return;
      const existing = map.get(uid);
      if (!existing || date > existing) map.set(uid, date);
    };

    const [subordinates, bookings] = await Promise.all([
      this.prisma.user.findMany({
        where: { createdBy: { in: ids } },
        select: { createdBy: true, createdAt: true },
      }),
      this.prisma.booking.findMany({
        where: { createdBy: { in: ids } },
        select: { createdBy: true, createdAt: true },
      }),
    ]);

    subordinates.forEach((r) => r.createdBy != null && consider(r.createdBy, r.createdAt));
    bookings.forEach((r) => r.createdBy != null && consider(r.createdBy, r.createdAt));
    return map;
  }

  // Rule 5 — Daily scheduler logic. For every non-Admin user:
  //   Active   = created a subordinate OR booked a customer within last 90 days
  //   Inactive = BOTH activities missing for 90 consecutive days
  // The reference window starts at lastActivityAt ?? reactivatedAt ?? createdAt.
  async autoDeactivateInactiveUsers(): Promise<{ checked: number; deactivated: number; reactivated: number }> {
    const now = new Date();
    const cutoff = this.getInactivityCutoff(now);

    const users = await this.prisma.user.findMany({
      where: { role: { not: 'Admin' } },
      select: { id: true, status: true, createdAt: true, lastActivityAt: true, reactivatedAt: true },
    });

    const activityMap = await this.getLastActivityByUser(users.map((u) => u.id));
    const referenceDate = (u: any): Date | null => {
      const candidates = [activityMap.get(u.id), u.lastActivityAt, u.reactivatedAt, u.createdAt].filter(Boolean);
      return candidates.length ? new Date(Math.max(...candidates.map((d: Date) => d.getTime()))) : null;
    };

    const toDeactivate: number[] = [];
    const toReactivate: number[] = [];

    for (const u of users) {
      const ref = referenceDate(u);
      const hasRecentActivity = ref !== null && ref >= cutoff;
      if (u.status === 'Active' && !hasRecentActivity) {
        toDeactivate.push(u.id);
      } else if (u.status !== 'Active' && hasRecentActivity) {
        toReactivate.push(u.id);
      }
    }

    if (toDeactivate.length > 0) {
      await this.prisma.user.updateMany({
        where: { id: { in: toDeactivate } },
        data: { status: 'Inactive' },
      });
    }
    if (toReactivate.length > 0) {
      await this.prisma.user.updateMany({
        where: { id: { in: toReactivate } },
        data: { status: 'Active' },
      });
    }

    if (toDeactivate.length > 0) {
      this.logger.log(`Auto-inactivity: deactivated ${toDeactivate.length} user(s) with no activity for ${this.INACTIVITY_DAYS}+ days`);
    }
    if (toReactivate.length > 0) {
      this.logger.log(`Auto-inactivity: reactivated ${toReactivate.length} user(s) who performed activity again`);
    }

    return {
      checked: users.length,
      deactivated: toDeactivate.length,
      reactivated: toReactivate.length,
    };
  }

  // Rule 4 — Only Admin can reactivate an inactive user.
  // Sets status Active, records reactivatedAt/reactivatedBy and resets
  // lastActivityAt to now (a fresh 90-day cycle starts from today).
  async reactivate(id: number, adminUser?: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status: 'Active',
        lastActivityAt: now,
        reactivatedAt: now,
        reactivatedBy: adminUser?.id ?? null,
      },
      include: { parent: true, children: true },
    });

    this.logger.log(`User ${user.name} (${user.employeeCode}) reactivated by ${adminUser?.name || 'unknown'}`);
    const { pin, ...result } = updated;
    return result;
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