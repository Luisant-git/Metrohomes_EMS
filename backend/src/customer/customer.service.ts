import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  register(dto: CreateCustomerDto) {
    const data: any = {
      name: dto.name,
      phone: dto.mobile,
      email: dto.email,
      address: dto.address,
      location: dto.location,
      status: dto.status || 'Interested',
      siteId: dto.siteId,
      createdBy: dto.createdBy,
      visitDate: dto.visitDate ? new Date(dto.visitDate) : undefined,
      visitTime: dto.visitTime,
      persons: dto.persons,
      purchaseMode: dto.purchaseMode,
      driverName: dto.driverName,
      driverMobile: dto.driverMobile,
      cabNumber: dto.cabNumber,
      notes: dto.notes,
      occupation: dto.occupation,
      pinCode: dto.pinCode,
      salesManagerId: dto.salesManagerId,
      salesManagerName: dto.salesManagerName,
      salesManagerMobile: dto.salesManagerMobile,
    };
    return this.prisma.customer.create({ data });
  }

  async findAll() {
    return this.prisma.customer.findMany({
      include: {
        site: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}