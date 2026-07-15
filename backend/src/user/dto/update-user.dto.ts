// src/user/dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto, UserStatus } from './create-user.dto';
import { IsOptional, IsEnum, IsString, IsNumber, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'http://localhost:3000/uploads/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}
