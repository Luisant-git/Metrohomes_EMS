// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
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

  // ---------------------------------------------------
  // OTP flow
  // ---------------------------------------------------
  async requestOtp(employeeCode: string) {
    const user = await this.userService.findByIdentifier(employeeCode);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // generate 4‑digit OTP preserving leading zeros
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.userService.update(user.id, {
      pin: hashedOtp,
      pinExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      pinAttempts: 0,
    } as any);

    // send via WhatsApp (assume sendOtp method exists)
    await this.whatsappService.sendOtp(user.mobile, otp);
    return { message: 'OTP sent' };
  }

  async verifyOtp(employeeCode: string, otp: string) {
    const user = await this.userService.findByIdentifier(employeeCode);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.pin || !user.pinExpiresAt) {
      throw new BadRequestException('No OTP requested');
    }

    if (new Date() > user.pinExpiresAt) {
      await this.userService.update(user.id, {
        pin: null,
        pinExpiresAt: null,
        pinAttempts: 0,
      } as any);
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    const isMatch = await bcrypt.compare(otp, user.pin);
    if (!isMatch) {
      await this.userService.update(user.id, { pinAttempts: { increment: 1 } } as any);
      throw new BadRequestException('Invalid OTP');
    }

    // Successful verification – clear OTP fields
    await this.userService.update(user.id, {
      pin: null,
      pinExpiresAt: null,
      pinAttempts: 0,
    } as any);

    const payload = { sub: user.id, mobileNumber: user.mobile };
    const accessToken = this.jwtService.sign(payload);
    const { pin: _, ...userData } = user;
    return { accessToken, user: userData };
  }
}