// src/dashboard/dashboard.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  // Get all team member IDs under a given user (recursive downline)
  private async getTeamMembers(userId: number): Promise<number[]> {
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

  // Get dashboard overview for the current user
  async getDashboard(currentUser: any) {
    const isAdminOrDirector = ['Admin', 'Director'].includes(currentUser?.role);
    let teamUserIds: number[] = [];

    if (isAdminOrDirector) {
      // Admin/Director sees all users
      const allUsers = await this.prisma.user.findMany({ select: { id: true } });
      teamUserIds = allUsers.map(u => u.id);
    } else {
      // Others see their team only
      teamUserIds = await this.getTeamMembers(currentUser.id);
      teamUserIds.push(currentUser.id);
    }

    // Get Sales Manager IDs within the team
    const teamUsers = await this.prisma.user.findMany({
      where: { id: { in: teamUserIds } },
    });

    const smIds = teamUsers.filter(u => u.role === 'Sales Manager').map(u => u.id);

    // Counts
    const teamSize = teamUsers.length;
    const smCount = smIds.length;

    // We don't have sites/customers/bookings/visits in DB yet (they use mock data)
    // So for now return user-centric stats similar to what dashboard.js utility does
    
    // Count roles in the downline
    const downlineRoleCounts: Record<string, number> = {};
    const downline = teamUsers.filter(u => u.id !== currentUser.id);
    for (const u of downline) {
      if (u.role) {
        downlineRoleCounts[u.role] = (downlineRoleCounts[u.role] || 0) + 1;
      }
    }

    return {
      teamSize,
      smCount,
      totalUsers: teamUserIds.length,
      downlineRoleCounts: Object.entries(downlineRoleCounts).map(([role, count]) => ({ role, count })),
      role: currentUser.role,
      name: currentUser.name,
    };
  }

  // Get downline role counts (equivalent to the utility function in dashboard.js)
  async getDownlineRoleCounts(currentUser: any) {
    const teamIds = await this.getTeamMembers(currentUser.id);
    const downlineUsers = await this.prisma.user.findMany({
      where: { id: { in: teamIds } },
    });

    const roleCounts: Record<string, number> = {};
    for (const u of downlineUsers) {
      if (u.role) {
        roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
      }
    }

    const ROLE_ORDER = ['Regional Manager', 'Branch Manager', 'BDM', 'Sales Manager'];
    return Object.entries(roleCounts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => ROLE_ORDER.indexOf(a[0]) - ROLE_ORDER.indexOf(b[0]))
      .map(([role, count]) => ({ role, count }));
  }
}