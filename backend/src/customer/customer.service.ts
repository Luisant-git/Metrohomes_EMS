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

    const existingMobile = await this.prisma.customer.findFirst({
      where: { phone: dto.mobile },
    });
    if (existingMobile) {
      throw new BadRequestException('A customer with this mobile number is already registered');
    }

    if (dto.email) {
      const existingEmail = await this.prisma.customer.findFirst({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new BadRequestException('A customer with this email address is already registered');
      }
    }

    const data: any = {
      name: dto.name,
      phone: dto.mobile,
      email: dto.email || null,
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
      const created = await this.prisma.customer.create({ 
        data,
        include: {
          site: { select: { name: true } },
          user: { select: { name: true } },
        }
      });
      
      // Return sanitized response with null -> empty string conversions
      return {
        id: created.id,
        name: created.name,
        mobile: created.phone,
        email: created.email || '',
        address: created.address || '',
        location: created.location || '',
        status: created.status || 'Interested',
        siteId: created.siteId,
        siteName: created.site?.name || '',
        createdById: created.createdBy,
        salesManagerName: created.user?.name || '',
        visitDate: created.visitDate ? new Date(created.visitDate).toISOString().split('T')[0] : '',
        visitTime: created.visitTime || '',
        persons: created.persons,
        driverName: created.driverName || '',
        driverMobile: created.driverMobile || '',
        cabNumber: created.cabNumber || '',
        notes: created.notes || '',
        occupation: created.occupation || '',
        purchaseMode: created.purchaseMode || '',
        pinCode: created.pinCode || '',
        registeredDate: created.createdAt ? new Date(created.createdAt).toISOString().split('T')[0] : '',
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = error?.meta?.target || [];
        if (target.includes('phone')) {
          throw new BadRequestException('A customer with this mobile number is already registered');
        }
        if (target.includes('email')) {
          throw new BadRequestException('A customer with this email address is already registered');
        }
        throw new BadRequestException('Duplicate entry detected');
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

  async checkDuplicate(mobile?: string, email?: string) {
    if (mobile) {
      const existingMobile = await this.prisma.customer.findFirst({
        where: { phone: mobile },
      });
      if (existingMobile) {
        return `A customer with mobile number ${mobile} is already registered`;
      }
    }
    if (email) {
      const existingEmail = await this.prisma.customer.findFirst({
        where: { email },
      });
      if (existingEmail) {
        return `A customer with email address ${email} is already registered`;
      }
    }
    return null;
  }
}
