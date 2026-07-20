import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  register(dto: CreateCustomerDto) {
    const data: any = {
      name: dto.name,
      mobile: dto.mobile,
      email: dto.email,
      address: dto.address,
      location: dto.location,
      status: dto.status || 'Interested',
      siteId: dto.siteId,
      salesManagerId: dto.salesManagerId,
      visitDate: dto.visitDate,
      driverName: dto.driverName,
      driverMobile: dto.driverMobile,
      cabNumber: dto.cabNumber,
      notes: dto.notes,
    };
    return this.prisma.customer.create({ data });
  }

  async findAll() {
    return this.prisma.customer.findMany();
  }
}