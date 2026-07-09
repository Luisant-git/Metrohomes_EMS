// src/auth/dto/login.dto.ts
import { IsString, Length, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Login identifier (employeeCode, email, or mobile)',
    example: 'SM001',
    examples: ['SM001', 'john@example.com', '9876543210'],
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({
    description: '4-digit PIN',
    example: '1234',
    minLength: 4,
    maxLength: 4,
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  @Matches(/^[0-9]{4}$/, { message: 'PIN must be exactly 4 digits' })
  pin: string;
}