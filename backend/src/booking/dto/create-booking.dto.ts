// src/booking/dto/create-booking.dto.ts
import { Type, Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsNumber } from 'class-validator';

export enum PaymentMode {
  CASH = 'Cash',
  CHEQUE = 'Cheque',
  DD = 'DD',
  ONLINE_TRANSFER = 'Online Transfer',
}

export class CreateBookingDto {
  @IsInt()
  @Type(() => Number)
  customerId: number;

  @IsInt()
  @Type(() => Number)
  projectId: number;

  @IsInt()
  @Type(() => Number)
  siteId: number;

  @IsString()
  @IsNotEmpty()
  bookingDate: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? null : value))
  guardianName?: string | null;

  @IsNumber()
  plotArea: number;

  @IsNumber()
  pricePerSqft: number;

  @IsNumber()
  plotPrice: number;

  @IsNumber()
  paidAmount: number;

  @IsNumber()
  remainingAmount: number;

  @IsString()
  @IsOptional()
  paymentMode?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  chequeNo?: string;

  @IsString()
  @IsOptional()
  chequeDate?: string;

  @IsString()
  @IsOptional()
  transferId?: string;

  @IsString()
  @IsOptional()
  loanOrOwn?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  assignedTo?: number;

  @IsString()
  @IsOptional()
  assignedToUserName?: string;

  @IsString()
  @IsOptional()
  officeIdNo?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  siteVisitId?: number;
}