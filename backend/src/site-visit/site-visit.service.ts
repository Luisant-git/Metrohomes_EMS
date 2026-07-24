import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteVisitDto } from './dto/create-site-visit.dto';

@Injectable()
export class SiteVisitService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSiteVisitDto) {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Verify site exists
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
    });
    if (!site) {
      throw new NotFoundException('Site not found');
    }

    const visit = await this.prisma.siteVisit.create({
      data: {
        customerId: dto.customerId,
        siteId: dto.siteId,
        visitDate: dto.visitDate ? new Date(dto.visitDate) : new Date(),
        visitTime: dto.visitTime || '09:00',
        persons: dto.persons,
        pickupLocation: dto.pickupLocation,
        purchaseMode: dto.purchaseMode,
        notes: dto.notes,
        status: dto.status || 'Interested',
        assignedTo: dto.assignedTo,
        driverName: dto.driverName,
        driverMobile: dto.driverMobile,
        cabNumber: dto.cabNumber,
      },
      include: {
        site: { select: { name: true, location: true } },
        assignedToUser: { select: { name: true, employeeCode: true } },
      },
    });

    return visit;
  }

  async findAll() {
    return this.prisma.siteVisit.findMany({
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        site: { select: { name: true, location: true } },
        assignedToUser: { select: { name: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCustomer(customerId: number) {
    return this.prisma.siteVisit.findMany({
      where: { customerId },
      include: {
        site: { select: { name: true, location: true } },
        assignedToUser: { select: { name: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const visit = await this.prisma.siteVisit.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        site: { select: { name: true, location: true } },
        assignedToUser: { select: { name: true, employeeCode: true, mobile: true } },
      },
    });
    if (!visit) throw new NotFoundException('Site visit not found');
    return visit;
  }

  async update(id: number, data: any) {
    const visit = await this.prisma.siteVisit.findUnique({ where: { id } });
    if (!visit) throw new NotFoundException('Site visit not found');

    const updateData: any = {};
    if (data.siteId !== undefined) updateData.siteId = data.siteId;
    if (data.visitDate !== undefined) updateData.visitDate = new Date(data.visitDate);
    if (data.visitTime !== undefined) updateData.visitTime = data.visitTime;
    if (data.persons !== undefined) updateData.persons = data.persons;
    if (data.pickupLocation !== undefined) updateData.pickupLocation = data.pickupLocation;
    if (data.purchaseMode !== undefined) updateData.purchaseMode = data.purchaseMode;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.driverName !== undefined) updateData.driverName = data.driverName;
    if (data.driverMobile !== undefined) updateData.driverMobile = data.driverMobile;
    if (data.cabNumber !== undefined) updateData.cabNumber = data.cabNumber;

    return this.prisma.siteVisit.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        site: { select: { name: true, location: true } },
        assignedToUser: { select: { name: true, employeeCode: true } },
      },
    });
  }

  async remove(id: number) {
    const visit = await this.prisma.siteVisit.findUnique({ where: { id } });
    if (!visit) throw new NotFoundException('Site visit not found');
    return this.prisma.siteVisit.delete({ where: { id } });
  }
}