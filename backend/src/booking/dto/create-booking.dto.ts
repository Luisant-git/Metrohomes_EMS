import { Transform, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsNumber, IsDateString, IsEnum } from 'class-validator';


export enum PaymentMode {
  CASH = 'Cash',
  CHEQUE = 'Cheque',
  DD = 'DD',
  ONLINE_TRANSFER = 'Online Transfer',
}

export class CreateBookingDto {
  @IsInt()
  customerId: number;

  @IsInt()
  siteId: number;

  @IsString()
  @IsNotEmpty()
  bookingDate: string;

  @IsString()
  @IsNotEmpty()
  applicantName: string;

  @IsString()
  @IsOptional()
  relation?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  pinCode?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  email?: string;

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
  paymentMode?: PaymentMode;

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

  @IsString()
  @IsOptional()
  propertyType?: string;

  @IsString()
  @IsOptional()
  projectName?: string;

  @IsString()
  @IsOptional()
  projectNo?: string;

  @IsString()
  @IsOptional()
  location?: string;
}