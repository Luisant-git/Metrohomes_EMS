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

    let customer = await this.prisma.customer.findFirst({
      where: { phone: dto.mobile },
    });

    const isNewCustomer = !customer;

    if (!customer) {
      if (dto.email) {
        const existingEmail = await this.prisma.customer.findFirst({
          where: { email: dto.email },
        });
        if (existingEmail) {
          throw new BadRequestException('A customer with this email address is already registered');
        }
      }

      customer = await this.prisma.customer.create({
        data: {
          name: dto.name,
          phone: dto.mobile,
          email: dto.email || null,
          address: dto.address,
          pinCode: dto.pinCode,
          occupation: dto.occupation,
          createdBy: dto.createdBy,
        },
      });
    } else {
      if (dto.name) {
        await this.prisma.customer.update({
          where: { id: customer.id },
          data: { name: dto.name },
        });
      }
    }

    if (dto.siteId) {
      const visit = await this.prisma.siteVisit.create({
        data: {
          customerId: customer.id,
          siteId: dto.siteId,
          visitDate: dto.visitDate ? new Date(dto.visitDate) : new Date(),
          visitTime: dto.visitTime || '09:00',
          persons: dto.persons,
          pickupLocation: dto.location,
          purchaseMode: dto.purchaseMode,
          notes: dto.notes,
          status: dto.status || 'Interested',
          assignedTo: dto.createdBy || customer.createdBy,
          driverName: dto.driverName,
          driverMobile: dto.driverMobile,
          cabNumber: dto.cabNumber,
        },
        include: {
          site: { select: { name: true } },
          assignedToUser: { select: { name: true } },
        },
      });

      return {
        id: customer.id,
        visitId: visit.id,
        name: customer.name,
        mobile: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        pinCode: customer.pinCode || '',
        occupation: customer.occupation || '',
        status: visit.status || 'Interested',
        siteId: visit.siteId,
        siteName: visit.site?.name || '',
        createdById: customer.createdBy,
        salesManagerName: visit.assignedToUser?.name || '',
        visitDate: visit.visitDate ? new Date(visit.visitDate).toISOString().split('T')[0] : '',
        visitTime: visit.visitTime || '',
        persons: visit.persons,
        location: visit.pickupLocation || '',
        purchaseMode: visit.purchaseMode || '',
        notes: visit.notes || '',
        driverName: visit.driverName || '',
        driverMobile: visit.driverMobile || '',
        cabNumber: visit.cabNumber || '',
        registeredDate: customer.createdAt ? new Date(customer.createdAt).toISOString().split('T')[0] : '',
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        isNewCustomer,
      };
    }

    return {
      id: customer.id,
      name: customer.name,
      mobile: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      pinCode: customer.pinCode || '',
      occupation: customer.occupation || '',
      status: 'Interested',
      siteId: null,
      siteName: '',
      createdById: customer.createdBy,
      salesManagerName: '',
      visitDate: '',
      visitTime: '',
      persons: null,
      location: '',
      purchaseMode: '',
      notes: '',
      driverName: '',
      driverMobile: '',
      cabNumber: '',
      registeredDate: customer.createdAt ? new Date(customer.createdAt).toISOString().split('T')[0] : '',
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      isNewCustomer,
    };
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: { id: true, name: true, employeeCode: true, role: true, mobile: true },
    });

    const customers = await this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const customerIds = customers.map(c => c.id);
    const visits = customerIds.length > 0 ? await this.prisma.siteVisit.findMany({
      where: { customerId: { in: customerIds } },
      include: {
        site: { select: { name: true } },
        assignedToUser: { select: { name: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    }) : [];

    const visitsByCustomer = {};
    visits.forEach(v => {
      if (!visitsByCustomer[v.customerId]) visitsByCustomer[v.customerId] = [];
      visitsByCustomer[v.customerId].push(v);
    });

    return customers.map((c) => {
      const customerVisits = visitsByCustomer[c.id] || [];
      const latestVisit = customerVisits[0];
      const creator = users.find(u => u.id === c.createdBy);
      return {
        id: c.id,
        name: c.name,
        mobile: c.phone,
        email: c.email,
        address: c.address,
        pinCode: c.pinCode,
        occupation: c.occupation,
        status: latestVisit?.status || 'Interested',
        siteId: latestVisit?.siteId || null,
        siteName: latestVisit?.site?.name || '',
        createdById: c.createdBy,
        salesManagerName: creator ? `${creator.name} (${creator.employeeCode})` : (latestVisit?.assignedToUser?.name || ''),
        visitDate: latestVisit?.visitDate ? new Date(latestVisit.visitDate).toISOString().split('T')[0] : '',
        visitTime: latestVisit?.visitTime || '',
        persons: latestVisit?.persons || null,
        location: latestVisit?.pickupLocation || '',
        purchaseMode: latestVisit?.purchaseMode || '',
        notes: latestVisit?.notes || '',
        driverName: latestVisit?.driverName || '',
        driverMobile: latestVisit?.driverMobile || '',
        cabNumber: latestVisit?.cabNumber || '',
        visitCount: customerVisits.length,
        visits: customerVisits.map(v => ({
          id: v.id,
          siteName: v.site?.name,
          visitDate: v.visitDate ? new Date(v.visitDate).toISOString().split('T')[0] : '',
          visitTime: v.visitTime || '',
          persons: v.persons,
          purchaseMode: v.purchaseMode || '',
          status: v.status || '',
          registeredBy: v.assignedToUser?.name || '',
          registeredByRole: v.assignedToUser?.employeeCode || '',
        })),
        registeredDate: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '',
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });
  }

  async findOne(id: number) {
    const c = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        visits: {
          include: {
            site: { select: { name: true } },
            assignedToUser: { select: { name: true, employeeCode: true, mobile: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!c) return null;

    const latestVisit = c.visits[0];
    return {
      ...c,
      mobile: c.phone,
      visits: c.visits.map(v => ({
        id: v.id,
        siteId: v.siteId,
        siteName: v.site?.name,
        visitDate: v.visitDate,
        visitTime: v.visitTime,
        persons: v.persons,
        pickupLocation: v.pickupLocation,
        purchaseMode: v.purchaseMode,
        notes: v.notes,
        status: v.status,
        driverName: v.driverName,
        driverMobile: v.driverMobile,
        cabNumber: v.cabNumber,
        assignedToName: v.assignedToUser?.name,
        assignedToRole: v.assignedToUser?.employeeCode,
        assignedToMobile: v.assignedToUser?.mobile,
        createdAt: v.createdAt,
      })),
      siteName: latestVisit?.site?.name || '',
      salesManagerName: latestVisit?.assignedToUser?.name || c.user?.name || '',
      visitDate: latestVisit?.visitDate,
      visitTime: latestVisit?.visitTime,
      persons: latestVisit?.persons,
      location: latestVisit?.pickupLocation,
      purchaseMode: latestVisit?.purchaseMode,
      notes: latestVisit?.notes,
      driverName: latestVisit?.driverName,
      driverMobile: latestVisit?.driverMobile,
      cabNumber: latestVisit?.cabNumber,
      visitCount: c.visits.length,
    };
  }

  async update(id: number, data: any) {
    const updateData: any = {};
    if (data.mobile !== undefined) updateData.phone = data.mobile;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.pinCode !== undefined) updateData.pinCode = data.pinCode;
    if (data.occupation !== undefined) updateData.occupation = data.occupation;
    if (data.name !== undefined) updateData.name = data.name;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.customer.update({ where: { id }, data: updateData });
    }

    const visitFields = ['status', 'driverName', 'driverMobile', 'cabNumber', 'notes', 'siteId', 'visitDate', 'visitTime', 'persons', 'purchaseMode', 'location'];
    const hasVisitUpdate = visitFields.some(f => data[f] !== undefined);

    if (hasVisitUpdate) {
      const latestVisit = await this.prisma.siteVisit.findFirst({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
      });

      if (latestVisit) {
        const visitUpdate: any = {};
        if (data.status !== undefined) visitUpdate.status = data.status;
        if (data.driverName !== undefined) visitUpdate.driverName = data.driverName;
        if (data.driverMobile !== undefined) visitUpdate.driverMobile = data.driverMobile;
        if (data.cabNumber !== undefined) visitUpdate.cabNumber = data.cabNumber;
        if (data.notes !== undefined) visitUpdate.notes = data.notes;
        if (data.siteId !== undefined) visitUpdate.siteId = data.siteId;
        if (data.visitDate !== undefined) visitUpdate.visitDate = new Date(data.visitDate);
        if (data.visitTime !== undefined) visitUpdate.visitTime = data.visitTime;
        if (data.persons !== undefined) visitUpdate.persons = data.persons;
        if (data.purchaseMode !== undefined) visitUpdate.purchaseMode = data.purchaseMode;
        if (data.location !== undefined) visitUpdate.pickupLocation = data.location;

        if (Object.keys(visitUpdate).length > 0) {
          await this.prisma.siteVisit.update({
            where: { id: latestVisit.id },
            data: visitUpdate,
          });
        }
      }
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.prisma.siteVisit.deleteMany({ where: { customerId: id } });
    return this.prisma.customer.delete({ where: { id } });
  }

  async checkDuplicate(mobile?: string, email?: string) {
    const result = { exists: false, customer: null };

    if (mobile) {
      const existingMobile = await this.prisma.customer.findFirst({
        where: { phone: mobile },
      });
      if (existingMobile) {
        result.exists = true;
        result.customer = existingMobile;
        return result;
      }
    }

    if (email) {
      const existingEmail = await this.prisma.customer.findFirst({
        where: { email },
      });
      if (existingEmail) {
        result.exists = true;
        result.customer = existingEmail;
        return result;
      }
    }
    return result;
  }

  async findByMobile(mobile: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { phone: mobile },
      include: {
        visits: {
          include: {
            site: { select: { name: true } },
            assignedToUser: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return customer;
  }
}