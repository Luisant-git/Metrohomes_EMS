// src/site/site.controller.ts
// Routes at /sites → operate on Project model (frontend compatibility).
// Routes at /sites/:projectId/plots → manage child Site records.
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

@ApiTags('Sites (Projects)')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SiteController {
    constructor(private siteService: SiteService) { }

    // ── Project CRUD ──────────────────────────────────────────────────

    @Post()
    @Roles('Admin', 'Director')
    @ApiOperation({ summary: 'Create a new project (with optional embedded plots)' })
    @ApiBody({ type: CreateSiteDto })
    create(@Body() body: CreateSiteDto, @CurrentUser() currentUser: any) {
        return this.siteService.create(body, currentUser);
    }

    @Get()
    @ApiOperation({ summary: 'Get all projects (includes embedded plots/sites)' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'status', required: false })
    findAll(
        @Query('search') search?: string,
        @Query('status') status?: string,
    ) {
        return this.siteService.findAll(search, status);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get project + site statistics' })
    getStats() {
        return this.siteService.getStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get project by ID (includes embedded plots/sites)' })
    @ApiParam({ name: 'id', type: Number })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.siteService.findOne(id);
    }

    @Put(':id')
    @Roles('Admin', 'Director')
    @ApiOperation({ summary: 'Update project (syncs embedded plots array if provided)' })
    @ApiParam({ name: 'id', type: Number })
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
    @ApiOperation({ summary: 'Delete project (cascades all child sites)' })
    @ApiParam({ name: 'id', type: Number })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.siteService.remove(id);
    }

    // ── Nested Site (Plot) CRUD ────────────────────────────────────────

    @Post(':projectId/plots')
    @Roles('Admin', 'Director')
    @ApiOperation({ summary: 'Add a single plot/site to a project' })
    @ApiParam({ name: 'projectId', type: Number })
    addPlot(
        @Param('projectId', ParseIntPipe) projectId: number,
        @Body() body: any,
    ) {
        return this.siteService.addSiteToProject(projectId, body);
    }

    @Put(':projectId/plots/:siteId')
    @Roles('Admin', 'Director')
    @ApiOperation({ summary: 'Update a specific plot/site within a project' })
    @ApiParam({ name: 'projectId', type: Number })
    @ApiParam({ name: 'siteId', type: Number })
    updatePlot(
        @Param('projectId', ParseIntPipe) projectId: number,
        @Param('siteId', ParseIntPipe) siteId: number,
        @Body() body: any,
    ) {
        return this.siteService.updateSiteInProject(projectId, siteId, body);
    }

    @Delete(':projectId/plots/:siteId')
    @Roles('Admin', 'Director')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove a specific plot/site from a project' })
    @ApiParam({ name: 'projectId', type: Number })
    @ApiParam({ name: 'siteId', type: Number })
    removePlot(
        @Param('projectId', ParseIntPipe) projectId: number,
        @Param('siteId', ParseIntPipe) siteId: number,
    ) {
        return this.siteService.removeSiteFromProject(projectId, siteId);
    }
}