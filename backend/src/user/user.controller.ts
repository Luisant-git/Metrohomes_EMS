// src/user/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @Roles('Admin', 'Director')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  create(@Body() body: CreateUserDto, @CurrentUser() currentUser: any) {
    return this.userService.create(body, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, email, mobile, or employeeCode' })
  @ApiQuery({ name: 'parentUserId', required: false, type: Number, description: 'Filter by parent/manager ID' })
  findAll(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('parentUserId') parentUserId?: number,
    @CurrentUser() currentUser?: any,
  ) {
    return this.userService.findAll(role, status, search, parentUserId, currentUser);
  }

  @Get('stats')
  @Roles('Admin', 'Director')
  @ApiOperation({ summary: 'Get user statistics' })
  getStats() {
    return this.userService.getStats();
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get organization hierarchy' })
  getHierarchy(@CurrentUser() currentUser: any) {
    return this.userService.getHierarchy(currentUser);
  }

  @Get('team/:userId')
  @ApiOperation({ summary: 'Get team members' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID of the manager' })
  getTeam(@Param('userId', ParseIntPipe) userId: number, @CurrentUser() currentUser: any) {
    return this.userService.getTeam(userId, currentUser);
  }

  @Get('roles/creatable')
  @ApiOperation({ summary: 'Get creatable roles' })
  @ApiQuery({ name: 'role', required: true, description: 'Current user role' })
  getCreatableRoles(@Query('role') role: string) {
    return this.userService.getCreatableRoles(role);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  search(@Query('q') query: string, @CurrentUser() currentUser: any) {
    return this.userService.search(query, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: any) {
    return this.userService.findOne(id, currentUser);
  }

  @Put(':id')
  @Roles('Admin', 'Director')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.userService.update(id, body, currentUser);
  }

  @Put(':id/pin')
  @ApiOperation({ summary: 'Update PIN' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oldPin: { type: 'string', example: '1234' },
        newPin: { type: 'string', example: '5678' },
      },
      required: ['oldPin', 'newPin'],
    },
  })
  updatePin(
    @Param('id', ParseIntPipe) id: number,
    @Body('oldPin') oldPin: string,
    @Body('newPin') newPin: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.userService.updatePin(id, oldPin, newPin, currentUser);
  }

  @Put(':id/reset-pin')
  @Roles('Admin', 'Director')
  @ApiOperation({ summary: 'Reset PIN (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newPin: { type: 'string', example: '9999' },
      },
      required: ['newPin'],
    },
  })
  resetPin(@Param('id', ParseIntPipe) id: number, @Body('newPin') newPin: string) {
    return this.userService.resetPin(id, newPin);
  }

  @Put(':id/status')
  @Roles('Admin', 'Director')
  @ApiOperation({ summary: 'Update user status' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['Active', 'Inactive'] },
      },
      required: ['status'],
    },
  })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.userService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles('Admin', 'Director')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}