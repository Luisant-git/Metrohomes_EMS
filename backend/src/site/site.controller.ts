// src/site/site.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SiteService } from './site.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Sites')
@ApiBearerAuth()
@Controller('sites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SiteController {
    constructor(private siteService: SiteService) { }

    @Post()
    @Roles('Admin', 'Director')
    @ApiOperation({ summary: 'Create a new site' })
    @ApiBody({ type: CreateSiteDto })
    create(@Body() body: CreateSiteDto, @CurrentUser() currentUser: any) {
        return this.siteService.create(body, currentUser);
    }

    @Get()
    @ApiOperation({ summary: 'Get all sites' })
    @ApiQuery({ name: 'search', required: false, description: 'Search by name or location' })
    @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
    @ApiQuery({ name: 'type', required: false, description: 'Filter by type' })
    findAll(
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('type') type?: string,
    ) {
        return this.siteService.findAll(search, status, type);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get site statistics' })
    getStats() {
        return this.siteService.getStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get site by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'Site ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.siteService.findOne(id);
    }

    @Put(':id')
    @Roles('Admin', 'Director')
    @ApiOperation({ summary: 'Update site' })
    @ApiParam({ name: 'id', type: Number, description: 'Site ID' })
    @ApiBody({ type: UpdateSiteDto })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateSiteDto,
    ) {
        return this.siteService.update(id, body);
    }

    @Delete(':id')
    @Roles('Admin', 'Director')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete site' })
    @ApiParam({ name: 'id', type: Number, description: 'Site ID' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.siteService.remove(id);
    }
}