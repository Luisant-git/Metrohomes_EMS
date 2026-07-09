// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async registerAdmin(registerDto: RegisterDto) {
    const existingAdmin = await this.userService.findByRole('Admin');
    if (existingAdmin) {
      throw new ConflictException('Admin already exists. Please login.');
    }

    const user = await this.userService.create(
      {
        name: registerDto.name,
        email: registerDto.email,
        mobile: registerDto.mobile,
        pin: registerDto.pin,
        role: UserRole.ADMIN,
      },
      null,
    );

    return this.login({
      identifier: registerDto.email,
      pin: registerDto.pin,
    });
  }

  async login(loginDto: LoginDto) {
    const { identifier, pin } = loginDto;

    const user = await this.userService.findByIdentifier(identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'Active') {
      throw new UnauthorizedException('Account is inactive. Please contact HR.');
    }

    const isPinValid = await bcrypt.compare(pin, user.pin);
    if (!isPinValid) {
      throw new UnauthorizedException('Invalid PIN');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeCode: user.employeeCode,
    };

    const accessToken = this.jwtService.sign(payload);

    const { pin: _, ...userData } = user;

    return {
      accessToken,
      user: userData,
    };
  }

  async getProfile(userId: number) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}