import { IsString, IsNotEmpty, IsOptional, IsInt, IsDateString } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @IsOptional()
  siteId?: number;

  @IsInt()
  @IsOptional()
  salesManagerId?: number;

  @IsString()
  @IsOptional()
  visitDate?: string;

  @IsString()
  @IsOptional()
  visitTime?: string;

  @IsInt()
  @IsOptional()
  persons?: number;

  @IsString()
  @IsOptional()
  driverName?: string;

  @IsString()
  @IsOptional()
  driverMobile?: string;

  @IsString()
  @IsOptional()
  cabNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsString()
  @IsOptional()
  pinCode?: string;

  @IsString()
  @IsOptional()
  siteName?: string;

  @IsString()
  @IsOptional()
  salesManagerName?: string;

  @IsString()
  @IsOptional()
  salesManagerMobile?: string;
}