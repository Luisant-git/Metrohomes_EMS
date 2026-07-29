// src/site/dto/create-site.dto.ts
// DTO for creating a Project (exposed at /sites for frontend compatibility).
// Includes optional embedded plots[] for child Site creation.
import {
    IsString,
    IsOptional,
    IsNumber,
    IsEnum,
    IsArray,
    IsBoolean,
    MinLength,
    MaxLength,
    IsNotEmpty,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProjectStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}

export enum PlotStatus {
    AVAILABLE = 'Available',
    BOOKED = 'Booked',
    SOLD = 'Sold',
    ON_HOLD = 'On Hold',
}

export class CreatePlotDto {
    @ApiProperty({ example: '101' })
    @IsString()
    @IsNotEmpty()
    siteNo: string;

    @ApiPropertyOptional({ example: 'East' })
    @IsOptional()
    @IsString()
    facing?: string;

    @ApiPropertyOptional({ example: '30' })
    @IsOptional()
    @IsString()
    eastWest?: string;

    @ApiPropertyOptional({ example: '40' })
    @IsOptional()
    @IsString()
    northSouth?: string;

    @ApiProperty({ example: 1200 })
    @IsNumber()
    totalSqft: number;

    @ApiProperty({ example: 5500 })
    @IsNumber()
    pricePerSqft: number;

    @ApiPropertyOptional({ enum: PlotStatus, example: PlotStatus.AVAILABLE })
    @IsOptional()
    @IsString()
    status?: string;

    // Allow id for upsert operations on update
    @IsOptional()
    id?: number;
}

export class CreateSiteDto {
    @ApiProperty({ description: 'Project name', example: 'Green Valley Residency' })
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(200)
    name: string;

    @ApiProperty({ description: 'Project location', example: 'Sector 62, Noida' })
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(200)
    location: string;

    @ApiPropertyOptional({ description: 'Default price per sqft', example: 5500 })
    @IsOptional()
    @IsNumber()
    pricePerSqft?: number;

    @ApiPropertyOptional({ description: 'Project description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Project images (URLs or base64)', type: [String] })
    @IsOptional()
    @IsArray()
    images?: string[];

    @ApiPropertyOptional({ description: 'Brochure (URL or base64)' })
    @IsOptional()
    @IsString()
    brochure?: string;

    @ApiPropertyOptional({ description: 'Documents (URLs or base64)', type: [String] })
    @IsOptional()
    @IsArray()
    documents?: string[];

    @ApiPropertyOptional({ enum: ProjectStatus, example: ProjectStatus.ACTIVE })
    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;

    @ApiPropertyOptional({ description: 'Embedded site/plot items', type: [CreatePlotDto] })
    @IsOptional()
    @IsArray()
    plots?: CreatePlotDto[];

    // Frontend compat fields — ignored in DB, computed from plots[]
    @IsOptional()
    totalPlots?: number;

    @IsOptional()
    availablePlots?: number;
}