import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';

interface OtpData {
  hashedOtp: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);
  // In-memory OTP store for customer mobile verification
  // Key: mobile number, Value: OTP data (hashed OTP, expiry, attempts)
  private readonly otpStore = new Map<string, OtpData>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}

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
      // Update all provided fields for existing customer
      const updateData: any = {};
      if (dto.name) updateData.name = dto.name;
      if (dto.address !== undefined) updateData.address = dto.address;
      if (dto.pinCode !== undefined) updateData.pinCode = dto.pinCode;
      if (dto.occupation !== undefined) updateData.occupation = dto.occupation;
      if (dto.email !== undefined) updateData.email = dto.email;
      if (dto.createdBy !== undefined) updateData.createdBy = dto.createdBy;
      
      if (Object.keys(updateData).length > 0) {
        await this.prisma.customer.update({
          where: { id: customer.id },
          data: updateData,
        });
      }
      
      // Re-fetch customer to get updated data
      customer = await this.prisma.customer.findUnique({
        where: { id: customer.id },
      });
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

    const customers = await this.prisma.customer.findMany();

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

    const result = customers.map((c) => {
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
        _latestVisitCreatedAt: latestVisit?.createdAt || c.createdAt,
      };
    });

    // Sort by latest visit creation date (newest first), so returning customers with new visits appear on top
    result.sort((a, b) => {
      const dateA = new Date(a._latestVisitCreatedAt).getTime();
      const dateB = new Date(b._latestVisitCreatedAt).getTime();
      return dateB - dateA;
    });

    return result;
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

    let latestVisit: any = null;
    const visitFields = ['status', 'driverName', 'driverMobile', 'cabNumber', 'notes', 'siteId', 'visitDate', 'visitTime', 'persons', 'purchaseMode', 'location'];
    const hasVisitUpdate = visitFields.some(f => data[f] !== undefined);

    if (hasVisitUpdate) {
      latestVisit = await this.prisma.siteVisit.findFirst({
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

    // Only send WhatsApp templates when status is being changed TO "Visit Scheduled"
    // This prevents duplicate messages when driver details are updated separately
    // after the status has already been set to "Visit Scheduled"
    const statusChangedToScheduled = data.status === 'Visit Scheduled' && latestVisit?.status !== 'Visit Scheduled';

    // Re-fetch customer to get the latest state after all updates
    const updatedCustomer = await this.findOne(id);

    if (statusChangedToScheduled && updatedCustomer && updatedCustomer.visits && updatedCustomer.visits.length > 0) {
      const visit = updatedCustomer.visits[0];
      // 1. Send site_visit_scheduled template to the customer
      try {
        await this.whatsappService.sendSiteVisitScheduled(
          updatedCustomer.phone,
          updatedCustomer.name,
          visit.siteName || '',
          visit.driverName || 'Not assigned',
          visit.driverMobile || 'N/A',
          visit.cabNumber || 'N/A',
        );
        this.logger.log(`Site visit scheduled template sent to customer ${updatedCustomer.phone}`);
      } catch (whatsappError: any) {
        this.logger.error(`Failed to send site visit template to customer: ${whatsappError.message}`);
      }

      // 2. Send customer_site_visit_confirmation template to the employee who created the customer
      try {
        const creator = await this.prisma.user.findUnique({
          where: { id: updatedCustomer.createdBy },
        });
        if (creator && creator.mobile) {
          const timeStr = visit.visitTime
            ? (() => { const [h, m] = visit.visitTime.split(':'); const hour = parseInt(h, 10); const ampm = hour >= 12 ? 'PM' : 'AM'; const hour12 = hour % 12 || 12; return `${hour12}:${m} ${ampm}`; })()
            : 'N/A';
          const dateStr = visit.visitDate
            ? new Date(visit.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'N/A';
          await this.whatsappService.sendCustomerSiteVisitConfirmation(
            creator.mobile,
            creator.name || 'Sales Manager',
            updatedCustomer.name,
            updatedCustomer.phone,
            visit.siteName || '',
            dateStr,
            timeStr,
            visit.driverName || 'Not assigned',
            visit.driverMobile || 'N/A',
            visit.cabNumber || 'N/A',
          );
          this.logger.log(`Customer site visit confirmation template sent to employee ${creator.mobile}`);
        }
      } catch (whatsappError: any) {
        this.logger.error(`Failed to send customer site visit confirmation to employee: ${whatsappError.message}`);
      }
    }

    return updatedCustomer;
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
      // Ignore temporary OTP placeholder records
      if (existingMobile && !existingMobile.name.startsWith('TEMP_OTP_')) {
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

  // ---------------------------------------------------
  // Customer Mobile Verification OTP flow
  // Uses in-memory store - no database records created for OTP
  // ---------------------------------------------------
  async requestCustomerOtp(mobile: string) {
    // Generate 4-digit OTP preserving leading zeros
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store OTP in memory (not in database)
    this.otpStore.set(mobile, {
      hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
    });

    // Reuse existing sendOtp method from WhatsappService (metrohomes_verification_code_v1 template)
    await this.whatsappService.sendOtp(mobile, otp);

    this.logger.log(`Customer OTP sent to ${mobile}`);
    return { message: 'OTP sent to mobile number' };
  }

  async verifyCustomerOtp(mobile: string, otp: string) {
    const otpData = this.otpStore.get(mobile);
    if (!otpData) {
      throw new BadRequestException('No OTP requested for this mobile number');
    }

    if (new Date() > otpData.expiresAt) {
      this.otpStore.delete(mobile);
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    const isMatch = await bcrypt.compare(otp, otpData.hashedOtp);
    if (!isMatch) {
      otpData.attempts++;
      throw new BadRequestException('Invalid OTP');
    }

    // Successful verification – clear OTP from memory
    this.otpStore.delete(mobile);

    return { message: 'Mobile number verified successfully', verified: true };
  }
}
