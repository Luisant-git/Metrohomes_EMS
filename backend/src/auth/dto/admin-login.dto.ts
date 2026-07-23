// src/auth/dto/admin-login.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Admin login identifier (email, employee code, or mobile)',
    example: 'admin@example.com',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({
    description: 'Admin PIN or password',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  pin: string;
}
