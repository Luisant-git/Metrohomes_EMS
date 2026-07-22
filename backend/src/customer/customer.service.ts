import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: CreateCustomerDto) {
    if (!dto.mobile) {
      throw new BadRequestException('Mobile number is required');
    }

    const existing = await this.prisma.customer.findFirst({
      where: { phone: dto.mobile },
    });
    if (existing) {
      throw new BadRequestException('A customer with this mobile number is already registered');
    }

    const data: any = {
      name: dto.name,
      phone: dto.mobile,
      email: dto.email,
      address: dto.address,
      location: dto.location,
      status: dto.status || 'Interested',
      siteId: dto.siteId,
      visitDate: dto.visitDate ? new Date(dto.visitDate) : undefined,
      visitTime: dto.visitTime,
      persons: dto.persons,
      driverName: dto.driverName,
      driverMobile: dto.driverMobile,
      cabNumber: dto.cabNumber,
      notes: dto.notes,
      occupation: dto.occupation,
      purchaseMode: dto.purchaseMode,
      pinCode: dto.pinCode,
      createdBy: dto.createdBy,
    };

    try {
      return await this.prisma.customer.create({ data });
    } catch (error) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('A customer with this mobile number is already registered');
      }
      throw error;
    }
  }

  async findAll() {
    const customers = await this.prisma.customer.findMany({
      include: {
        site: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      mobile: c.phone,
      email: c.email,
      address: c.address,
      location: c.location,
      status: c.status || 'Interested',
      siteId: c.siteId,
      siteName: c.site?.name || '',
      createdById: c.createdBy,
      salesManagerName: c.user?.name || '',
      visitDate: c.visitDate ? new Date(c.visitDate).toISOString().split('T')[0] : '',
      visitTime: c.visitTime,
      persons: c.persons,
      driverName: c.driverName,
      driverMobile: c.driverMobile,
      cabNumber: c.cabNumber,
      notes: c.notes,
      occupation: c.occupation,
      purchaseMode: c.purchaseMode,
      pinCode: c.pinCode,
      registeredDate: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  async findOne(id: number) {
    const c = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        site: { select: { name: true } },
        user: { select: { name: true } },
      },
    });
    if (!c) return null;
    return {
      ...c,
      mobile: c.phone,
      siteName: c.site?.name || '',
      salesManagerName: c.user?.name || '',
    };
  }

  async update(id: number, data: any) {
    const updateData: any = {};
    if (data.mobile !== undefined) updateData.phone = data.mobile;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.siteId !== undefined) updateData.siteId = data.siteId;
    if (data.driverName !== undefined) updateData.driverName = data.driverName;
    if (data.driverMobile !== undefined) updateData.driverMobile = data.driverMobile;
    if (data.cabNumber !== undefined) updateData.cabNumber = data.cabNumber;
    if (data.notes !== undefined) updateData.notes = data.notes;
    return this.prisma.customer.update({ where: { id }, data: updateData });
  }

  async remove(id: number) {
    return this.prisma.customer.delete({ where: { id } });
  }
}