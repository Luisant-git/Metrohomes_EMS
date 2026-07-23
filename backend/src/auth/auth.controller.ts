// src/auth/auth.controller.ts
import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBody, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('admin-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dedicated login endpoint for Admin role',
    description: 'Authenticate admin users directly using user identifier and PIN/password.',
  })
  @ApiBody({ type: AdminLoginDto })
  adminLogin(@Body() body: AdminLoginDto) {
    return this.authService.adminLogin(body);
  }

  @Post('register-admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register first admin user',
    description: 'Create the first admin user. Role is automatically set to Admin.'
  })
  @ApiBody({ type: RegisterDto })
  registerAdmin(@Body() body: RegisterDto) {
    return this.authService.registerAdmin(body);
  }

  @Post('request-otp')
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.employeeCode);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.employeeCode, dto.otp);
  }


  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}