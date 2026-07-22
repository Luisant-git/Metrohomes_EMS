// src/auth/dto/request-otp.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({
    description: 'Employee Code (User ID) to send OTP to',
    example: 'EMP0001',
  })
  @IsString()
  @IsNotEmpty()
  employeeCode: string;
}
