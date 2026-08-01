// src/site-visit/dto/create-site-visit.dto.ts
import { Transform, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsDateString } from 'class-validator';

export class CreateSiteVisitDto {
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  customerId: number;

  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  projectId: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  })
  @IsInt()
  siteId?: number;

  @IsDateString()
  @IsOptional()
  visitDate?: Date;

  @IsString()
  @IsOptional()
  visitTime?: string;

  @IsInt()
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value, 10) : value)
  @IsOptional()
  persons?: number;

  @IsString()
  @IsOptional()
  pickupLocation?: string;

  @IsString()
  @IsOptional()
  purchaseMode?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  assignedTo?: number;

  @IsString()
  @IsOptional()
  driverName?: string;

  @IsString()
  @IsOptional()
  driverMobile?: string;

  @IsString()
  @IsOptional()
  cabNumber?: string;
}