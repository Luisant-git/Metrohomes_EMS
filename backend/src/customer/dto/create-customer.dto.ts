import { Transform, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsDateString, Allow } from 'class-validator';

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
  @Type(() => Number)
  @IsOptional()
  createdBy?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  siteId?: number;
    @Allow()
    @IsInt()
    @IsOptional()
    salesManagerId?: number;

    @Allow()
    @IsString()
    @IsOptional()
    salesManagerName?: string;

    @Allow()
    @IsString()
    @IsOptional()
    salesManagerMobile?: string;

    @Allow()
    @IsString()
    @IsOptional()
    siteName?: string;

  @IsString()
  @IsOptional()
  visitTime?: string;

  @IsInt()
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value, 10) : value)
  @IsOptional()
  persons?: number;

  @IsString()
  @IsOptional()
  purchaseMode?: string;





  @IsDateString()
  @IsOptional()
  visitDate?: Date;

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
}