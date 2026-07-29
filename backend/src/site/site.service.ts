// src/site/site.service.ts
// NOTE: This service operates on the `Project` model (exposed at /sites for frontend compatibility).
// Each Project has child `Site` records (plots), managed via embedded plots[] in the payload.
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Injectable()
export class SiteService {
    private readonly logger = new Logger(SiteService.name);

    constructor(private prisma: PrismaService) { }

    // ─── CREATE PROJECT ────────────────────────────────────────────────
    async create(dto: CreateSiteDto, currentUser?: any) {
        const { plots, totalPlots, availablePlots, ...projectData } = dto as any;

        const project = await this.prisma.project.create({
            data: {
                name: projectData.name,
                location: projectData.location,
                pricePerSqft: projectData.pricePerSqft ? parseFloat(projectData.pricePerSqft) : null,
                description: projectData.description || null,
                images: projectData.images || [],
                brochure: projectData.brochure || null,
                documents: projectData.documents || [],
                status: projectData.status || 'Active',
                createdBy: currentUser?.id || null,
            },
        });

        // Create embedded site items (plots)
        if (plots && Array.isArray(plots) && plots.length > 0) {
            await this.prisma.site.createMany({
                data: plots.map((p: any) => ({
                    projectId: project.id,
                    siteNo: String(p.siteNo),
                    facing: p.facing || 'East',
                    eastWest: p.eastWest ? String(p.eastWest) : null,
                    northSouth: p.northSouth ? String(p.northSouth) : null,
                    totalSqft: parseFloat(p.totalSqft) || 0,
                    pricePerSqft: parseFloat(p.pricePerSqft) || 0,
                    status: p.status || 'Active',
                })),
            });
        }

        this.logger.log(`Project created: ${project.name} (ID: ${project.id})`);
        return this.findOne(project.id);
    }

    // ─── FIND ALL PROJECTS ─────────────────────────────────────────────
    async findAll(search?: string, status?: string) {
        const where: any = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } },
            ];
        }

        const projects = await this.prisma.project.findMany({
            where,
            include: {
                sites: { orderBy: { siteNo: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return projects.map(p => this.formatProject(p));
    }

    // ─── FIND ONE PROJECT ──────────────────────────────────────────────
    async findOne(id: number) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                sites: { orderBy: { siteNo: 'asc' } },
            },
        });

        if (!project) throw new NotFoundException('Project not found');
        return this.formatProject(project);
    }

    // ─── UPDATE PROJECT ────────────────────────────────────────────────
    async update(id: number, dto: UpdateSiteDto) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project) throw new NotFoundException('Project not found');

        const { plots, totalPlots, availablePlots, ...rest } = dto as any;

        const updateData: any = {};
        if (rest.name !== undefined) updateData.name = rest.name;
        if (rest.location !== undefined) updateData.location = rest.location;
        if (rest.pricePerSqft !== undefined) updateData.pricePerSqft = rest.pricePerSqft ? parseFloat(rest.pricePerSqft) : null;
        if (rest.description !== undefined) updateData.description = rest.description;
        if (rest.status !== undefined) updateData.status = rest.status;
        if (rest.images !== undefined) updateData.images = rest.images;
        if (rest.brochure !== undefined) updateData.brochure = rest.brochure;
        if (rest.documents !== undefined) updateData.documents = rest.documents;

        await this.prisma.project.update({ where: { id }, data: updateData });

        // Sync plots: full replace strategy with ID tracking
        if (plots !== undefined && Array.isArray(plots)) {
            // IDs in submitted list (plots that came from DB)
            const submittedIds = plots.filter((p: any) => p.id).map((p: any) => Number(p.id));

            // Delete sites not in submitted list (only if Active — preserve Booked/Sold)
            await this.prisma.site.deleteMany({
                where: {
                    projectId: id,
                    status: 'Active',
                    ...(submittedIds.length > 0 ? { id: { notIn: submittedIds } } : {}),
                },
            });

            for (const p of plots) {
                if (p.id) {
                    // Update existing site
                    const siteExists = await this.prisma.site.findFirst({ where: { id: Number(p.id), projectId: id } });
                    if (siteExists) {
                        await this.prisma.site.update({
                            where: { id: Number(p.id) },
                            data: {
                                siteNo: String(p.siteNo),
                                facing: p.facing || 'East',
                                eastWest: p.eastWest ? String(p.eastWest) : null,
                                northSouth: p.northSouth ? String(p.northSouth) : null,
                                totalSqft: parseFloat(p.totalSqft) || 0,
                                pricePerSqft: parseFloat(p.pricePerSqft) || 0,
                                status: p.status || 'Active',
                            },
                        });
                    }
                } else {
                    // Create new site
                    await this.prisma.site.create({
                        data: {
                            projectId: id,
                            siteNo: String(p.siteNo),
                            facing: p.facing || 'East',
                            eastWest: p.eastWest ? String(p.eastWest) : null,
                            northSouth: p.northSouth ? String(p.northSouth) : null,
                            totalSqft: parseFloat(p.totalSqft) || 0,
                            pricePerSqft: parseFloat(p.pricePerSqft) || 0,
                            status: p.status || 'Active',
                        },
                    });
                }
            }
        }

        this.logger.log(`Project updated: ID ${id}`);
        return this.findOne(id);
    }

    // ─── DELETE PROJECT ────────────────────────────────────────────────
    async remove(id: number) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project) throw new NotFoundException('Project not found');

        await this.prisma.project.delete({ where: { id } });
        this.logger.log(`Project deleted: ${project.name} (ID: ${project.id})`);
    }

    // ─── ADD INDIVIDUAL SITE (PLOT) TO PROJECT ─────────────────────────
    async addSiteToProject(projectId: number, siteData: any) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) throw new NotFoundException('Project not found');

        return this.prisma.site.create({
            data: {
                projectId,
                siteNo: String(siteData.siteNo),
                facing: siteData.facing || 'East',
                eastWest: siteData.eastWest ? String(siteData.eastWest) : null,
                northSouth: siteData.northSouth ? String(siteData.northSouth) : null,
                totalSqft: parseFloat(siteData.totalSqft) || 0,
                pricePerSqft: parseFloat(siteData.pricePerSqft) || 0,
                status: siteData.status || 'Active',
            },
        });
    }

    // ─── UPDATE INDIVIDUAL SITE IN PROJECT ─────────────────────────────
    async updateSiteInProject(projectId: number, siteId: number, siteData: any) {
        const site = await this.prisma.site.findFirst({ where: { id: siteId, projectId } });
        if (!site) throw new NotFoundException('Site not found in this project');

        return this.prisma.site.update({
            where: { id: siteId },
            data: {
                siteNo: siteData.siteNo !== undefined ? String(siteData.siteNo) : site.siteNo,
                facing: siteData.facing ?? site.facing,
                eastWest: siteData.eastWest !== undefined ? (siteData.eastWest ? String(siteData.eastWest) : null) : site.eastWest,
                northSouth: siteData.northSouth !== undefined ? (siteData.northSouth ? String(siteData.northSouth) : null) : site.northSouth,
                totalSqft: siteData.totalSqft !== undefined ? parseFloat(siteData.totalSqft) : site.totalSqft,
                pricePerSqft: siteData.pricePerSqft !== undefined ? parseFloat(siteData.pricePerSqft) : site.pricePerSqft,
                status: siteData.status ?? site.status,
            },
        });
    }

    // ─── DELETE INDIVIDUAL SITE FROM PROJECT ────────────────────────────
    async removeSiteFromProject(projectId: number, siteId: number) {
        const site = await this.prisma.site.findFirst({ where: { id: siteId, projectId } });
        if (!site) throw new NotFoundException('Site not found in this project');
        await this.prisma.site.delete({ where: { id: siteId } });
    }

    // ─── GET STATS ───────────────────────────────────────────────────────
    async getStats() {
        const total = await this.prisma.project.count();
        const active = await this.prisma.project.count({ where: { status: 'Active' } });
        const inactive = await this.prisma.project.count({ where: { status: 'Inactive' } });
        const totalSites = await this.prisma.site.count();
        const availableSites = await this.prisma.site.count({ where: { status: 'Active' } });

        return { total, active, inactive, totalSites, availableSites };
    }

    // ─── FORMAT PROJECT RESPONSE ─────────────────────────────────────────
    private formatProject(project: any) {
        const plots = project.sites || [];
        return {
            ...project,
            plots,
            totalPlots: plots.length,
            availablePlots: plots.filter((s: any) => s.status === 'Active').length,
        };
    }
}