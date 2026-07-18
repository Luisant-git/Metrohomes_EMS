// src/site/site.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Injectable()
export class SiteService {
    private readonly logger = new Logger(SiteService.name);

    constructor(private prisma: PrismaService) { }

    // ─── CREATE SITE ────────────────────────────────────────────────
    async create(createSiteDto: CreateSiteDto, currentUser?: any) {
        const site = await this.prisma.site.create({
            data: {
                name: createSiteDto.name,
                location: createSiteDto.location,
                type: createSiteDto.type,
                totalPlots: createSiteDto.totalPlots,
                availablePlots: createSiteDto.availablePlots,
                pricePerSqft: createSiteDto.pricePerSqft,
                totalArea: createSiteDto.totalArea,
                description: createSiteDto.description,
                images: createSiteDto.images || [],
                brochure: createSiteDto.brochure,
                documents: createSiteDto.documents || [],
                status: createSiteDto.status || 'Active',
                createdBy: currentUser?.id || null,
            },
        });

        this.logger.log(`Site created: ${site.name} (ID: ${site.id})`);
        return site;
    }

    // ─── FIND ALL SITES ─────────────────────────────────────────────
    async findAll(search?: string, status?: string, type?: string) {
        const where: any = {};

        if (status) where.status = status;
        if (type) where.type = type;

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.site.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    // ─── FIND ONE SITE ──────────────────────────────────────────────
    async findOne(id: number) {
        const site = await this.prisma.site.findUnique({
            where: { id },
        });

        if (!site) {
            throw new NotFoundException('Site not found');
        }

        return site;
    }

    // ─── UPDATE SITE ────────────────────────────────────────────────
    async update(id: number, updateSiteDto: UpdateSiteDto) {
        const site = await this.prisma.site.findUnique({
            where: { id },
        });

        if (!site) {
            throw new NotFoundException('Site not found');
        }

        const updateData: any = { ...updateSiteDto };

        // Handle JSON fields properly
        if (updateSiteDto.images !== undefined) {
            updateData.images = updateSiteDto.images;
        }
        if (updateSiteDto.documents !== undefined) {
            updateData.documents = updateSiteDto.documents;
        }

        const updatedSite = await this.prisma.site.update({
            where: { id },
            data: updateData,
        });

        this.logger.log(`Site updated: ${updatedSite.name} (ID: ${updatedSite.id})`);
        return updatedSite;
    }

    // ─── DELETE SITE ────────────────────────────────────────────────
    async remove(id: number) {
        const site = await this.prisma.site.findUnique({
            where: { id },
        });

        if (!site) {
            throw new NotFoundException('Site not found');
        }

        await this.prisma.site.delete({
            where: { id },
        });

        this.logger.log(`Site deleted: ${site.name} (ID: ${site.id})`);
    }

    // ─── GET STATS ──────────────────────────────────────────────────
    async getStats() {
        const total = await this.prisma.site.count();
        const active = await this.prisma.site.count({
            where: { status: 'Active' },
        });
        const inactive = await this.prisma.site.count({
            where: { status: 'Inactive' },
        });
        const totalPlotsAgg = await this.prisma.site.aggregate({
            _sum: { totalPlots: true },
        });

        return {
            total,
            active,
            inactive,
            totalPlots: totalPlotsAgg._sum.totalPlots || 0,
        };
    }
}