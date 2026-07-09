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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
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
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email or mobile already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid role hierarchy or parent user',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Parent user not found',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: any,
  ): Promise<UserResponseDto> {
    const creatableRoles = await this.userService.getCreatableRoles(currentUser.role);
    if (!creatableRoles.includes(createUserDto.role)) {
      throw new BadRequestException(
        `${currentUser.role} cannot create ${createUserDto.role} role`
      );
    }

    createUserDto.createdBy = currentUser.id;
    if (!createUserDto.parentUserId) {
      createUserDto.parentUserId = currentUser.id;
    }

    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['Admin', 'Director', 'Regional Manager', 'Branch Manager', 'BDM', 'Sales Manager'],
    description: 'Filter by role',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['Active', 'Inactive'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, email, mobile, or employeeCode',
  })
  @ApiQuery({
    name: 'parentUserId',
    required: false,
    description: 'Filter by parent/manager ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: [UserResponseDto],
  })
  async findAll(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('parentUserId') parentUserId?: string,
    @CurrentUser() currentUser?: any,
  ): Promise<UserResponseDto[]> {
    if (!['Admin', 'Director'].includes(currentUser?.role)) {
      const teamIds = await this.userService.getTeamMembers(currentUser.id);
      const users = await this.userService.findAll({
        role,
        status,
        search,
        parentUserId,
      });
      return users.filter((user) => user.id === currentUser.id || teamIds.includes(user.id));
    }

    return this.userService.findAll({
      role,
      status,
      search,
      parentUserId,
    });
  }

  @Get('stats')
  @Roles('Admin', 'Director')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        total: 10,
        active: 8,
        inactive: 2,
        roles: [
          { role: 'Admin', count: 1 },
          { role: 'Sales Manager', count: 5 },
        ],
      },
    },
  })
  async getStats() {
    return this.userService.getStats();
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get organization hierarchy' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hierarchy retrieved successfully',
    type: [UserResponseDto],
  })
  async getHierarchy(@CurrentUser() currentUser?: any): Promise<UserResponseDto[]> {
    if (['Admin', 'Director'].includes(currentUser?.role)) {
      return this.userService.getHierarchy();
    }
    const user = await this.userService.findOne(currentUser.id);
    return [user];
  }

  @Get('team/:userId')
  @ApiOperation({ summary: 'Get team members' })
  @ApiParam({
    name: 'userId',
    description: 'User ID of the manager',
    example: 'cm8j8...',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team members retrieved successfully',
    type: [UserResponseDto],
  })
  async getTeam(
    @Param('userId') userId: string,
    @CurrentUser() currentUser?: any,
  ): Promise<UserResponseDto[]> {
    if (!['Admin', 'Director'].includes(currentUser?.role)) {
      const teamIds = await this.userService.getTeamMembers(currentUser.id);
      if (userId !== currentUser.id && !teamIds.includes(userId)) {
        throw new BadRequestException('You do not have access to this team');
      }
    }
    return this.userService.findAll({ parentUserId: userId });
  }

  @Get('roles/creatable')
  @ApiOperation({ summary: 'Get creatable roles' })
  @ApiQuery({
    name: 'role',
    required: true,
    description: 'Current user role',
    example: 'Admin',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Creatable roles retrieved successfully',
    schema: {
      example: ['Director', 'Regional Manager', 'Branch Manager', 'BDM', 'Sales Manager'],
    },
  })
  async getCreatableRoles(@Query('role') role: string): Promise<string[]> {
    return this.userService.getCreatableRoles(role);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query',
    example: 'John',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results',
    type: [UserResponseDto],
  })
  async search(
    @Query('q') query: string,
    @CurrentUser() currentUser?: any,
  ): Promise<UserResponseDto[]> {
    const users = await this.userService.findAll({ search: query });
    if (!['Admin', 'Director'].includes(currentUser?.role)) {
      const teamIds = await this.userService.getTeamMembers(currentUser.id);
      return users.filter((user) => user.id === currentUser.id || teamIds.includes(user.id));
    }
    return users;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'cm8j8...',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User details retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser?: any,
  ): Promise<UserResponseDto> {
    const user = await this.userService.findOne(id);
    if (!['Admin', 'Director'].includes(currentUser?.role)) {
      const teamIds = await this.userService.getTeamMembers(currentUser.id);
      if (user.id !== currentUser.id && !teamIds.includes(user.id)) {
        throw new BadRequestException('You do not have access to this user');
      }
    }
    return user;
  }

  @Put(':id')
  @Roles('Admin', 'Director')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'cm8j8...',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email or mobile already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser?: any,
  ): Promise<UserResponseDto> {
    if (updateUserDto.role && currentUser.role !== 'Admin') {
      throw new BadRequestException('Only Admin can change roles');
    }
    return this.userService.update(id, updateUserDto);
  }

  @Put(':id/pin')
  @ApiOperation({ summary: 'Update PIN' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'cm8j8...',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oldPin: { type: 'string', example: '1234', description: 'Current 4-digit PIN' },
        newPin: { type: 'string', example: '5678', description: 'New 4-digit PIN' },
      },
      required: ['oldPin', 'newPin'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PIN updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid current PIN or new PIN format',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async updatePin(
    @Param('id') id: string,
    @Body('oldPin') oldPin: string,
    @Body('newPin') newPin: string,
    @CurrentUser() currentUser?: any,
  ): Promise<UserResponseDto> {
    if (!oldPin || !newPin) {
      throw new BadRequestException('Both oldPin and newPin are required');
    }
    if (!['Admin', 'Director'].includes(currentUser?.role)) {
      const user = await this.userService.findOne(id);
      if (user.id !== currentUser.id) {
        throw new BadRequestException('You can only update your own PIN');
      }
    }
    return this.userService.updatePin(id, oldPin, newPin);
  }

  @Put(':id/reset-pin')
  @Roles('Admin', 'Director')
  @ApiOperation({ summary: 'Reset PIN (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'cm8j8...',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newPin: { type: 'string', example: '9999', description: 'New 4-digit PIN' },
      },
      required: ['newPin'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PIN reset successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid PIN format',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async resetPin(
    @Param('id') id: string,
    @Body('newPin') newPin: string,
  ): Promise<UserResponseDto> {
    if (!newPin) {
      throw new BadRequestException('newPin is required');
    }
    return this.userService.resetPin(id, newPin);
  }

  @Put(':id/status')
  @Roles('Admin', 'Director')
  @ApiOperation({ summary: 'Update user status' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'cm8j8...',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['Active', 'Inactive'], example: 'Active' },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<UserResponseDto> {
    return this.userService.updateStatus(id, status as any);
  }

  @Delete(':id')
  @Roles('Admin', 'Director')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'cm8j8...',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete user with team members',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.userService.remove(id);
  }
}