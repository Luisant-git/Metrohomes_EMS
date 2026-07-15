// src/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard overview for current user' })
  getDashboard(@CurrentUser() currentUser: any) {
    return this.dashboardService.getDashboard(currentUser);
  }

  @Get('downline-role-counts')
  @ApiOperation({ summary: 'Get downline role counts for current user' })
  getDownlineRoleCounts(@CurrentUser() currentUser: any) {
    return this.dashboardService.getDownlineRoleCounts(currentUser);
  }
}