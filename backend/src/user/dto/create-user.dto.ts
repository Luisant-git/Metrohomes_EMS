// src/user/dto/create-user.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  Length,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'Admin',
  DIRECTOR = 'Director',
  REGIONAL_MANAGER = 'Regional Manager',
  BRANCH_MANAGER = 'Branch Manager',
  BDM = 'BDM',
  SALES_MANAGER = 'Sales Manager',
}

export enum UserStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export class CreateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Email address of the user (unique)',
    example: 'john@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Mobile number (10 digits)',
    example: '9876543210',
    minLength: 10,
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(10)
  @Matches(/^[0-9]{10}$/, { message: 'Mobile must be exactly 10 digits' })
  mobile: string;

  @ApiProperty({
    description: '4-digit PIN for login',
    example: '1234',
    minLength: 4,
    maxLength: 4,
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  @Matches(/^[0-9]{4}$/, { message: 'PIN must be exactly 4 digits' })
  pin: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: UserRole,
    example: UserRole.SALES_MANAGER,
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiPropertyOptional({
    description: "Father's or Husband's name",
    example: 'Robert Doe',
  })
  @IsOptional()
  @IsString()
  fatherHusbandName?: string;

  @ApiPropertyOptional({
    description: 'Residential address',
    example: '123 Main Street, City, State - 123456',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({
    description: 'Nominee name',
    example: 'Jane Doe',
  })
  @IsOptional()
  @IsString()
  nomineeName?: string;

  @ApiPropertyOptional({
    description: 'Relationship with nominee',
    example: 'Spouse',
  })
  @IsOptional()
  @IsString()
  nomineeRelationship?: string;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'State Bank of India',
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({
    description: 'Bank account number',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  bankAccountNo?: string;

  @ApiPropertyOptional({
    description: 'IFSC code (11 characters)',
    example: 'SBIN0001234',
    pattern: '^[A-Z]{4}0[A-Z0-9]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC code format' })
  ifscCode?: string;

  @ApiPropertyOptional({
    description: 'Bank branch name',
    example: 'Main Branch',
  })
  @IsOptional()
  @IsString()
  bankBranch?: string;

  @ApiPropertyOptional({
    description: 'PAN card number (10 characters)',
    example: 'ABCDE1234F',
    pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'Invalid PAN format. Format: ABCDE1234F' })
  panNo?: string;

  @ApiPropertyOptional({
    description: 'Parent/Manager user ID (for hierarchy)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  parentUserId?: number;

  @ApiPropertyOptional({
    description: 'User who created this user',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  createdBy?: number;
}