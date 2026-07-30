// src/site-visit/site-visit.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteVisitDto } from './dto/create-site-visit.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class SiteVisitService {
  constructor(private readonly prisma: PrismaService, private readonly whatsappService: WhatsappService) {}

  async create(dto: CreateSiteVisitDto) {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify site exists and belongs to the project
    const site = await this.prisma.site.findFirst({
      where: { id: dto.siteId, projectId: dto.projectId },
    });
    if (!site) {
      throw new NotFoundException('Site not found in this project');
    }

    const visit = await this.prisma.siteVisit.create({
      data: {
        customerId: dto.customerId,
        projectId: dto.projectId,
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
        project: { select: { name: true, location: true } },
        site: { select: { siteNo: true, facing: true, totalSqft: true } },
        assignedToUser: { select: { name: true, employeeCode: true } },
      },
    });

    return this.formatVisit(visit);
  }

  async findAll() {
    const visits = await this.prisma.siteVisit.findMany({
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        project: { select: { name: true, location: true } },
        site: { select: { siteNo: true, facing: true, totalSqft: true } },
        assignedToUser: { select: { name: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return visits.map(v => this.formatVisit(v));
  }

  async findByCustomer(customerId: number) {
    const visits = await this.prisma.siteVisit.findMany({
      where: { customerId },
      include: {
        project: { select: { name: true, location: true } },
        site: { select: { siteNo: true, facing: true, totalSqft: true } },
        assignedToUser: { select: { name: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return visits.map(v => this.formatVisit(v));
  }

  async findOne(id: number) {
    const visit = await this.prisma.siteVisit.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        project: { select: { name: true, location: true } },
        site: { select: { siteNo: true, facing: true, totalSqft: true, pricePerSqft: true } },
        assignedToUser: { select: { name: true, employeeCode: true, mobile: true } },
      },
    });
    if (!visit) throw new NotFoundException('Site visit not found');
    return this.formatVisit(visit);
  }

  async update(id: number, data: any) {
    const visit = await this.prisma.siteVisit.findUnique({ where: { id } });
    if (!visit) throw new NotFoundException('Site visit not found');

    const updateData: any = {};
    if (data.projectId !== undefined) updateData.projectId = Number(data.projectId);
    if (data.siteId !== undefined) updateData.siteId = Number(data.siteId);
    if (data.visitDate !== undefined) updateData.visitDate = new Date(data.visitDate);
    if (data.visitTime !== undefined) updateData.visitTime = data.visitTime;
    if (data.persons !== undefined) updateData.persons = data.persons;
    if (data.pickupLocation !== undefined) updateData.pickupLocation = data.pickupLocation;
    if (data.purchaseMode !== undefined) updateData.purchaseMode = data.purchaseMode;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.driverName !== undefined) updateData.driverName = data.driverName;
    if (data.driverMobile !== undefined) updateData.driverMobile = data.driverMobile;
    if (data.cabNumber !== undefined) updateData.cabNumber = data.cabNumber;

    // Auto-set status to "Visit Scheduled" when driver details are provided
    const hasDriverDetails = data.driverName !== undefined || data.driverMobile !== undefined || data.cabNumber !== undefined;
    if (hasDriverDetails && (data.driverName || data.driverMobile || data.cabNumber)) {
      updateData.status = 'Visit Scheduled';
    } else if (data.status !== undefined) {
      updateData.status = data.status;
    }

    const updated = await this.prisma.siteVisit.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        project: { select: { name: true, location: true } },
        site: { select: { siteNo: true, facing: true, totalSqft: true } },
        assignedToUser: { select: { name: true, employeeCode: true, mobile: true } },
      },
    });

    // Send WhatsApp notifications if status is "Visit Scheduled" and driver details are provided
    if (updateData.status === 'Visit Scheduled' && (updateData.driverName || updateData.driverMobile || updateData.cabNumber)) {
      try {
        // Fetch complete visit data with relations for notifications
        const visitWithRelations = await this.prisma.siteVisit.findUnique({
          where: { id },
          include: {
            customer: { select: { id: true, name: true, phone: true, email: true } },
            project: { select: { name: true, location: true } },
            site: { select: { siteNo: true, facing: true, totalSqft: true } },
            assignedToUser: { select: { name: true, employeeCode: true, mobile: true } },
          },
        });

        if (visitWithRelations) {
          const siteName = `${visitWithRelations.project?.name || 'Project'} - Site ${visitWithRelations.site?.siteNo || 'N/A'}`;
          const visitDate = visitWithRelations.visitDate ? new Date(visitWithRelations.visitDate).toLocaleDateString('en-IN') : 'N/A';
          const visitTime = visitWithRelations.visitTime || 'N/A';
          const driverName = visitWithRelations.driverName || updateData.driverName || 'Not Assigned';
          const driverMobile = visitWithRelations.driverMobile || updateData.driverMobile || 'N/A';
          const vehicleNo = visitWithRelations.cabNumber || updateData.cabNumber || 'N/A';

          // Send to assigned user/sales manager
          if (visitWithRelations.assignedToUser?.mobile) {
            await this.whatsappService.sendCustomerSiteVisitConfirmation(
              visitWithRelations.assignedToUser.mobile,
              visitWithRelations.assignedToUser?.name || 'Sales Manager',
              visitWithRelations.customer?.name || '',
              visitWithRelations.customer?.phone || '',
              siteName,
              visitDate,
              visitTime,
              driverName,
              driverMobile,
              vehicleNo,
            );
          }

          // Send to customer
          if (visitWithRelations.customer?.phone) {
            await this.whatsappService.sendSiteVisitScheduled(
              visitWithRelations.customer.phone,
              visitWithRelations.customer?.name || '',
              siteName,
              visitDate,
              visitTime,
              driverName,
              driverMobile,
              vehicleNo,
            );
          }
        }
      } catch (error) {
        console.error('Failed to send WhatsApp notifications for site visit:', error);
      }
    }

    return this.formatVisit(updated);
  }

  async remove(id: number) {
    const visit = await this.prisma.siteVisit.findUnique({ where: { id } });
    if (!visit) throw new NotFoundException('Site visit not found');
    return this.prisma.siteVisit.delete({ where: { id } });
  }

  private formatVisit(visit: any) {
    return {
      ...visit,
      projectName: visit.project?.name || '',
      projectLocation: visit.project?.location || '',
      siteName: visit.site ? `${visit.project?.name || ''} - Site ${visit.site.siteNo}` : '',
      siteNo: visit.site?.siteNo || '',
    };
  }
}