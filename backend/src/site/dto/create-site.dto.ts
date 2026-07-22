// src/site/dto/create-site.dto.ts
import {
    IsString,
    IsOptional,
    IsNumber,
    IsEnum,
    IsArray,
    MinLength,
    MaxLength,
    IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SiteStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}

export class CreateSiteDto {
    @ApiProperty({
        description: 'Name of the site',
        example: 'Green Valley Residency',
        minLength: 2,
        maxLength: 200,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(200)
    name: string;

    @ApiProperty({
        description: 'Location of the site',
        example: 'Sector 62, Noida',
        minLength: 2,
        maxLength: 200,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(200)
    location: string;

    @ApiPropertyOptional({
        description: 'Total number of plots',
        example: 120,
    })
    @IsOptional()
    @IsNumber()
    totalPlots?: number;

    @ApiPropertyOptional({
        description: 'Number of available plots',
        example: 45,
    })
    @IsOptional()
    @IsNumber()
    availablePlots?: number;

    @ApiPropertyOptional({
        description: 'Price per square foot',
        example: 5500,
    })
    @IsOptional()
    @IsNumber()
    pricePerSqft?: number;

    @ApiPropertyOptional({
        description: 'Description of the site',
        example: 'Premium residential plots with world-class amenities.',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Site images (array of base64 strings or URLs)',
        example: ['data:image/png;base64,...'],
    })
    @IsOptional()
    @IsArray()
    images?: string[];

    @ApiPropertyOptional({
        description: 'Brochure file (base64 string or URL)',
        example: 'data:application/pdf;base64,...',
    })
    @IsOptional()
    @IsString()
    brochure?: string;

    @ApiPropertyOptional({
        description: 'Documents (array of base64 strings or URLs)',
        example: ['data:application/pdf;base64,...'],
    })
    @IsOptional()
    @IsArray()
    documents?: string[];

    @ApiPropertyOptional({
        description: 'Site status',
        enum: SiteStatus,
        example: SiteStatus.ACTIVE,
    })
    @IsOptional()
    @IsEnum(SiteStatus)
    status?: SiteStatus;
}