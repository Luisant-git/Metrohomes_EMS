// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserRole } from '../user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { identifier, pin } = loginDto;

    const user = await this.userService.findByIdentifier(identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'Active') {
      throw new UnauthorizedException('Account is inactive. Please contact HR.');
    }

    // user.pin exists in the full user object from database
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

    // Remove pin from response
    const { pin: _, ...userData } = user;

    return {
      accessToken,
      user: userData as any, // Type assertion to handle the response
    };
  }

  async registerAdmin(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingAdmin = await this.userService.findByRole('Admin');
    if (existingAdmin) {
      throw new ConflictException('Admin already exists. Please login.');
    }

    const user = await this.userService.create({
      name: registerDto.name,
      email: registerDto.email,
      mobile: registerDto.mobile,
      pin: registerDto.pin,
      role: 'Admin' as UserRole, // Type assertion
    });

    return this.login({
      identifier: registerDto.email,
      pin: registerDto.pin,
    });
  }

  async validateUser(userId: string) {
    return this.userService.findOne(userId);
  }

  async verifyPin(userId: string, pin: string): Promise<boolean> {
    const user = await this.userService.findByIdentifier(userId);
    if (!user) return false;
    // user.pin exists in the full database object
    return bcrypt.compare(pin, (user as any).pin);
  }
}