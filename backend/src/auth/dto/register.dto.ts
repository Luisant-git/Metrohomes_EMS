// src/auth/dto/register.dto.ts
import { IsString, IsEmail, Length, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the admin',
    example: 'Super Admin',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    description: 'Email address of the admin',
    example: 'admin@metrohomes.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Mobile number (10 digits)',
    example: '9999999999',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  @Matches(/^[0-9]{10}$/, { message: 'Mobile must be exactly 10 digits' })
  mobile: string;

  @ApiProperty({
    description: '4-digit PIN for admin login',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  @Matches(/^[0-9]{4}$/, { message: 'PIN must be exactly 4 digits' })
  pin: string;
}