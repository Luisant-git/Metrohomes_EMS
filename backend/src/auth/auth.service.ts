// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../user/dto/create-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private whatsappService: WhatsappService,
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

    // Send WhatsApp notification for admin registration
    try {
      await this.whatsappService.sendEmployeeRegistrationSuccess(
        registerDto.mobile,
        registerDto.name,
        user.employeeCode,
        'Admin',
        'System',
      );
      this.logger.log(`WhatsApp notification sent to ${registerDto.mobile}`);
    } catch (error) {
      // Don't block registration if WhatsApp fails
      this.logger.error(`WhatsApp notification failed: ${error.message}`);
    }

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