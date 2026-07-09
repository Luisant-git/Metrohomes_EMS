// src/user/dto/user-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from './create-user.dto';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique user ID',
    example: 'cm8j8...',
  })
  id: string;

  @ApiProperty({
    description: 'Employee code (unique identifier)',
    example: 'SM001',
  })
  employeeCode: string;

  @ApiProperty({
    description: 'Full name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Mobile number',
    example: '9876543210',
  })
  mobile: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.SALES_MANAGER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiPropertyOptional({
    description: "Father's or Husband's name",
    example: 'Robert Doe',
  })
  fatherHusbandName?: string;

  @ApiPropertyOptional({
    description: 'Residential address',
    example: '123 Main Street, City',
  })
  address?: string;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1990-01-15T00:00:00.000Z',
  })
  dob?: Date;

  @ApiPropertyOptional({
    description: 'Nominee name',
    example: 'Jane Doe',
  })
  nomineeName?: string;

  @ApiPropertyOptional({
    description: 'Relationship with nominee',
    example: 'Spouse',
  })
  nomineeRelationship?: string;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'State Bank of India',
  })
  bankName?: string;

  @ApiPropertyOptional({
    description: 'Bank account number',
    example: '1234567890',
  })
  bankAccountNo?: string;

  @ApiPropertyOptional({
    description: 'IFSC code',
    example: 'SBIN0001234',
  })
  ifscCode?: string;

  @ApiPropertyOptional({
    description: 'Bank branch',
    example: 'Main Branch',
  })
  bankBranch?: string;

  @ApiPropertyOptional({
    description: 'PAN number',
    example: 'ABCDE1234F',
  })
  panNo?: string;

  @ApiPropertyOptional({
    description: 'Parent/Manager user ID',
    example: 'cm8j8...',
  })
  parentUserId?: string;

  @ApiPropertyOptional({
    description: 'Parent/Manager user details',
    type: () => UserResponseDto,
  })
  parent?: UserResponseDto;

  @ApiPropertyOptional({
    description: 'Direct reports (children)',
    type: () => [UserResponseDto],
  })
  children?: UserResponseDto[];

  @ApiPropertyOptional({
    description: 'Created by user ID',
    example: 'cm8j8...',
  })
  createdBy?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}