import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CancelBookingDto {
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsOptional()
  cancellationReason?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  refundAmount?: number;
}
