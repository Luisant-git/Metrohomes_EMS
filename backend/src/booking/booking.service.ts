// src/booking/booking.service.ts
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { PdfService } from '../pdf/pdf.service';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
    private readonly pdfService: PdfService,
  ) {}

  async create(dto: CreateBookingDto, createdBy?: number) {
    // Generate unique receipt number from PaymentReceipt count
    const receiptCount = await this.prisma.paymentReceipt.count();
    const receiptNo = `RCPT${String(receiptCount + 1).padStart(4, '0')}`;

    // Fetch customer
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Fetch project
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new BadRequestException('Project not found');
    }

    // Fetch site (plot) and verify it belongs to the project
    const site = await this.prisma.site.findFirst({
      where: { id: dto.siteId, projectId: dto.projectId },
    });
    if (!site) {
      throw new BadRequestException('Site not found in this project');
    }

    // Get assigned user name if provided
    let assignedToUserName = dto.assignedToUserName;
    if (dto.assignedTo && !assignedToUserName) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.assignedTo },
      });
      assignedToUserName = user?.name || '';
    }

    const booking = await this.prisma.booking.create({
      data: {
        bookingDate: dto.bookingDate,
        customerId: dto.customerId,
        projectId: dto.projectId,
        siteId: dto.siteId,
        guardianName: dto.guardianName,
        plotArea: dto.plotArea,
        pricePerSqft: dto.pricePerSqft,
        plotPrice: dto.plotPrice,
        paidAmount: dto.paidAmount,
        remainingAmount: dto.remainingAmount,
        paymentMode: dto.paymentMode || 'Cash',
        bankName: dto.bankName,
        chequeNo: dto.chequeNo,
        chequeDate: dto.chequeDate,
        transferId: dto.transferId,
        loanOrOwn: dto.loanOrOwn || 'Own Fund',
        status: dto.status || 'Booked',
        assignedTo: dto.assignedTo,
        officeIdNo: dto.officeIdNo,
        notes: dto.notes,
        siteVisitId: dto.siteVisitId,
        createdBy,
        receipts: {
          create: {
            receiptNo,
            previousPaid: 0,
            currentPayment: dto.paidAmount,
            totalPaid: dto.paidAmount,
            balance: dto.remainingAmount,
            paymentMode: dto.paymentMode || 'Cash',
            bankName: dto.bankName,
            chequeNo: dto.chequeNo,
            chequeDate: dto.chequeDate,
            transferId: dto.transferId,
            paymentDate: dto.bookingDate || new Date().toISOString().split('T')[0],
          },
        },
      },
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        project: { select: { name: true, location: true } },
        site: { select: { siteNo: true, facing: true, totalSqft: true } },
        creator: { select: { name: true, employeeCode: true } },
        assignedToUser: { select: { name: true } },
        receipts: true,
      },
    });

    this.logger.log(`Booking created: ${receiptNo} for customer ${customer.name}`);

    // Update site status — Sold if fully paid at booking, Booked otherwise
    const siteStatus = dto.remainingAmount <= 0 ? 'Sold' : 'Booked';
    await this.prisma.site.update({
      where: { id: dto.siteId },
      data: { status: siteStatus },
    }).catch(() => {
      // Non-critical — don't fail the booking
    });

    // Generate PDF and send WhatsApp
    try {
      const isFull = dto.remainingAmount <= 0;

      const pdfFilename = await this.pdfService.generateBookingReceipt({
        receiptNo,
        bookingDate: dto.bookingDate || new Date().toISOString().split('T')[0],
        customerName: customer.name,
        customerPhone: customer.phone,
        siteName: `${project.name} - Site ${site.siteNo}`,
        projectName: project.name,
        plotArea: dto.plotArea,
        pricePerSqft: dto.pricePerSqft,
        plotPrice: dto.plotPrice,
        paidAmount: dto.paidAmount,
        remainingAmount: dto.remainingAmount,
        paymentMode: dto.paymentMode || 'Cash',
        bankName: dto.bankName,
        chequeNo: dto.chequeNo,
        chequeDate: dto.chequeDate,
        transferId: dto.transferId,
        isInitial: true,
        isPart: false,
        isFull,
      });

      const pdfUrl = this.pdfService.getPdfUrl(pdfFilename);
      await this.whatsappService.sendPlotBookingReceipt(customer.phone, customer.name, pdfUrl);
      this.logger.log(`Booking receipt WhatsApp sent to ${customer.phone}`);
    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp for booking ${receiptNo}: ${error.message}`);
    }

    return this.formatBooking(booking);
  }

  async findAll() {
    const bookings = await this.prisma.booking.findMany({
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        project: { select: { name: true, location: true } },
        site: { select: { siteNo: true, facing: true, totalSqft: true } },
        creator: { select: { name: true, employeeCode: true } },
        assignedToUser: { select: { name: true, mobile: true } },
        receipts: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map(b => this.formatBooking(b));
  }

  async findOne(id: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true, phone: true, email: true, address: true, pinCode: true } },
        project: { select: { name: true, location: true } },
        site: { select: { siteNo: true, facing: true, totalSqft: true, pricePerSqft: true } },
        creator: { select: { name: true, employeeCode: true } },
        assignedToUser: { select: { name: true, mobile: true } },
        receipts: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.formatBooking(booking);
  }

  async update(id: number, data: any) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const updateData: any = {};

    const allowedFields = [
      'plotArea', 'pricePerSqft', 'plotPrice', 'paidAmount', 'remainingAmount',
      'paymentMode', 'bankName', 'chequeNo', 'chequeDate', 'transferId', 'loanOrOwn',
      'status', 'assignedTo', 'officeIdNo', 'notes', 'guardianName', 'siteVisitId',
      'bookingDate',
    ];

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    const updated = await this.prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        project: { select: { name: true, location: true } },
        site: { select: { siteNo: true, facing: true, totalSqft: true } },
        creator: { select: { name: true, employeeCode: true } },
        assignedToUser: { select: { name: true, mobile: true } },
      },
    });

    this.logger.log(`Booking updated: ${updated.id}`);
    return this.formatBooking(updated);
  }

  async createReceipt(bookingId: number, amount: number, paymentMode: string, bankName?: string, chequeNo?: string, chequeDate?: string, transferId?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        project: { select: { name: true } },
        site: { select: { siteNo: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const previousPaid = booking.paidAmount;
    const totalPaid = previousPaid + amount;
    const balance = booking.plotPrice - totalPaid;

    const receiptCount = await this.prisma.paymentReceipt.count();
    const receiptNo = `RCPT${String(receiptCount + 1).padStart(4, '0')}`;

    let status = booking.status;
    if (previousPaid === 0) {
      status = 'Initial Payment';
    } else if (balance > 0) {
      status = 'Part Payment';
    } else {
      status = 'Full Payment';
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        paidAmount: totalPaid,
        remainingAmount: Math.max(0, balance),
        status,
        paymentMode,
        ...(bankName ? { bankName } : {}),
        ...(chequeNo ? { chequeNo } : {}),
        ...(chequeDate ? { chequeDate } : {}),
        ...(transferId ? { transferId } : {}),
      },
    });

    const receipt = await this.prisma.paymentReceipt.create({
      data: {
        receiptNo,
        bookingId,
        previousPaid,
        currentPayment: amount,
        totalPaid,
        balance,
        paymentMode,
        bankName,
        chequeNo,
        chequeDate,
        transferId,
        paymentDate: updatedBooking.bookingDate || new Date().toISOString().split('T')[0],
      },
    });

    // Fetch full booking for PDF
    const bookingWithDetails = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { select: { name: true, phone: true } },
        project: { select: { name: true } },
        site: { select: { siteNo: true } },
      },
    });

    if (bookingWithDetails) {
      try {
        const isFirstPayment = previousPaid === 0;
        const isInitial = isFirstPayment && amount > 0;
        const isPart = previousPaid > 0 && balance > 0;
        const isFull = balance <= 0;
        const projectName = bookingWithDetails.project?.name || '';
        const siteName = `${projectName} - Site ${bookingWithDetails.site?.siteNo || ''}`;

        const pdfFilename = await this.pdfService.generatePaymentReceipt({
          receiptNo,
          paymentDate: updatedBooking.bookingDate || new Date().toISOString().split('T')[0],
          customerName: bookingWithDetails.customer.name,
          customerPhone: bookingWithDetails.customer.phone,
          siteName,
          projectName,
          previousPaid,
          currentPayment: amount,
          totalPaid,
          balance,
          paymentMode,
          bankName,
          chequeNo,
          chequeDate,
          transferId,
          isInitial,
          isPart,
          isFull,
        });

        const pdfUrl = this.pdfService.getPdfUrl(pdfFilename);
        await this.whatsappService.sendPaymentReceipt(
          bookingWithDetails.customer.phone,
          bookingWithDetails.customer.name,
          pdfUrl,
        );

        this.logger.log(`Payment receipt WhatsApp sent to ${bookingWithDetails.customer.phone}`);
      } catch (error: any) {
        this.logger.error(`Failed to send WhatsApp for payment receipt ${receiptNo}: ${error.message}`);
      }
    }

    // If fully paid, mark site as Sold
    if (balance <= 0) {
      await this.prisma.site.update({
        where: { id: booking.siteId },
        data: { status: 'Sold' },
      }).catch(err => {
        this.logger.error(`Failed to update site status to Sold: ${err.message}`);
      });
    }

    return receipt;
  }

  async remove(id: number) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    await this.prisma.booking.delete({ where: { id } });
    return { success: true, message: 'Booking deleted successfully' };
  }

  async getStats() {
    const totalBookings = await this.prisma.booking.count();
    const totalRevenue = await this.prisma.booking.aggregate({
      _sum: { paidAmount: true, plotPrice: true },
    });
    const pendingAmount = await this.prisma.booking.aggregate({
      _sum: { remainingAmount: true },
    });

    const statusCounts = await this.prisma.booking.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return {
      totalBookings,
      totalRevenue: totalRevenue._sum.plotPrice || 0,
      totalPaid: totalRevenue._sum.paidAmount || 0,
      pendingAmount: pendingAmount._sum.remainingAmount || 0,
      statusCounts,
    };
  }

  async sendReceiptWhatsApp(receiptId: number) {
    const receipt = await this.prisma.paymentReceipt.findUnique({
      where: { id: receiptId },
      include: {
        booking: {
          include: {
            customer: { select: { name: true, phone: true } },
            project: { select: { name: true } },
            site: { select: { siteNo: true } },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    const booking = receipt.booking;
    const customer = booking.customer;
    const projectName = booking.project?.name || '';
    const siteName = `${projectName} - Site ${booking.site?.siteNo || ''}`;

    const isFirstPayment = receipt.previousPaid === 0;
    const isInitial = isFirstPayment;
    const isPart = receipt.previousPaid > 0 && receipt.balance > 0;
    const isFull = receipt.balance <= 0;

    try {
      let pdfFilename: string;
      let pdfUrl: string;

      if (isFirstPayment) {
        pdfFilename = await this.pdfService.generateBookingReceipt({
          receiptNo: receipt.receiptNo,
          bookingDate: receipt.paymentDate,
          customerName: customer.name,
          customerPhone: customer.phone,
          siteName,
          projectName,
          plotArea: booking.plotArea,
          pricePerSqft: booking.pricePerSqft,
          plotPrice: booking.plotPrice,
          paidAmount: receipt.totalPaid,
          remainingAmount: receipt.balance,
          paymentMode: receipt.paymentMode,
          bankName: receipt.bankName || undefined,
          chequeNo: receipt.chequeNo || undefined,
          chequeDate: receipt.chequeDate || undefined,
          transferId: receipt.transferId || undefined,
          isInitial,
          isPart,
          isFull,
        });

        pdfUrl = this.pdfService.getPdfUrl(pdfFilename);
        await this.whatsappService.sendPlotBookingReceipt(customer.phone, customer.name, pdfUrl);
      } else {
        pdfFilename = await this.pdfService.generatePaymentReceipt({
          receiptNo: receipt.receiptNo,
          paymentDate: receipt.paymentDate,
          customerName: customer.name,
          customerPhone: customer.phone,
          siteName,
          projectName,
          previousPaid: receipt.previousPaid,
          currentPayment: receipt.currentPayment,
          totalPaid: receipt.totalPaid,
          balance: receipt.balance,
          paymentMode: receipt.paymentMode,
          bankName: receipt.bankName || undefined,
          chequeNo: receipt.chequeNo || undefined,
          chequeDate: receipt.chequeDate || undefined,
          transferId: receipt.transferId || undefined,
          isInitial,
          isPart,
          isFull,
        });

        pdfUrl = this.pdfService.getPdfUrl(pdfFilename);
        await this.whatsappService.sendPaymentReceipt(customer.phone, customer.name, pdfUrl);
      }

      this.logger.log(`WhatsApp resent for receipt ${receipt.receiptNo} to ${customer.phone}`);
      return { phone: customer.phone, receiptNo: receipt.receiptNo, pdfUrl };
    } catch (error: any) {
      this.logger.error(`Failed to resend WhatsApp for receipt ${receipt.receiptNo}: ${error.message}`);
      throw error;
    }
  }

  async downloadReceiptPdf(receiptId: number): Promise<string> {
    const receipt = await this.prisma.paymentReceipt.findUnique({
      where: { id: receiptId },
      include: {
        booking: {
          include: {
            customer: { select: { name: true, phone: true } },
            project: { select: { name: true } },
            site: { select: { siteNo: true } },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    const booking = receipt.booking;
    const customer = booking.customer;
    const projectName = booking.project?.name || '';
    const siteName = `${projectName} - Site ${booking.site?.siteNo || ''}`;

    const isFirstPayment = receipt.previousPaid === 0;
    const isInitial = isFirstPayment;
    const isPart = receipt.previousPaid > 0 && receipt.balance > 0;
    const isFull = receipt.balance <= 0;

    let pdfFilename: string;

    if (isFirstPayment) {
      pdfFilename = await this.pdfService.generateBookingReceipt({
        receiptNo: receipt.receiptNo,
        bookingDate: receipt.paymentDate,
        customerName: customer.name,
        customerPhone: customer.phone,
        siteName,
        projectName,
        plotArea: booking.plotArea,
        pricePerSqft: booking.pricePerSqft,
        plotPrice: booking.plotPrice,
        paidAmount: receipt.totalPaid,
        remainingAmount: receipt.balance,
        paymentMode: receipt.paymentMode,
        bankName: receipt.bankName || undefined,
        chequeNo: receipt.chequeNo || undefined,
        chequeDate: receipt.chequeDate || undefined,
        transferId: receipt.transferId || undefined,
        isInitial,
        isPart,
        isFull,
      });
    } else {
      pdfFilename = await this.pdfService.generatePaymentReceipt({
        receiptNo: receipt.receiptNo,
        paymentDate: receipt.paymentDate,
        customerName: customer.name,
        customerPhone: customer.phone,
        siteName,
        projectName,
        previousPaid: receipt.previousPaid,
        currentPayment: receipt.currentPayment,
        totalPaid: receipt.totalPaid,
        balance: receipt.balance,
        paymentMode: receipt.paymentMode,
        bankName: receipt.bankName || undefined,
        chequeNo: receipt.chequeNo || undefined,
        chequeDate: receipt.chequeDate || undefined,
        transferId: receipt.transferId || undefined,
        isInitial,
        isPart,
        isFull,
      });
    }

    return this.pdfService.getPdfPath(pdfFilename);
  }

  async debugWhatsApp(to: string, templateName: 'plot_booking_receipt_v1' | 'payment_receipt') {
    if (templateName === 'plot_booking_receipt_v1') {
      return this.whatsappService.sendPlotBookingReceipt(to, 'Test User', 'http://localhost:3000/uploads/test.pdf');
    }
    return this.whatsappService.sendPaymentReceipt(to, 'Test User', 'http://localhost:3000/uploads/test.pdf');
  }

  async findByMobile(mobile: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { phone: mobile },
      include: {
        visits: {
          include: {
            project: { select: { name: true, id: true } },
            site: { select: { siteNo: true, id: true } },
            assignedToUser: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return { customer: null, booking: null, receipts: [] };
    }

    const booking = await this.prisma.booking.findFirst({
      where: { customerId: customer.id },
      include: {
        project: { select: { name: true, location: true } },
        site: { select: { siteNo: true, facing: true, totalSqft: true, pricePerSqft: true } },
        customer: { select: { name: true, phone: true, email: true, address: true, pinCode: true } },
        assignedToUser: { select: { name: true, mobile: true } },
        creator: { select: { name: true, employeeCode: true } },
        receipts: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const customerData = {
      id: customer.id,
      name: customer.name,
      mobile: customer.phone,
      email: customer.email,
      address: customer.address,
      pinCode: customer.pinCode,
      visits: customer.visits.map(v => ({
        id: v.id,
        projectId: v.projectId,
        siteId: v.siteId,
        projectName: (v as any).project?.name || '',
        siteNo: (v as any).site?.siteNo || '',
        visitDate: v.visitDate,
        assignedToName: v.assignedToUser?.name || '',
      })),
    };

    if (!booking) {
      return { customer: customerData, booking: null, receipts: [] };
    }

    const projectName = booking.project?.name || '';
    const bookingData = {
      id: booking.id,
      customerId: booking.customerId,
      customerName: booking.customer?.name || '',
      projectId: booking.projectId,
      projectName,
      siteId: booking.siteId,
      siteNo: booking.site?.siteNo || '',
      siteName: `${projectName} - Site ${booking.site?.siteNo || ''}`,
      location: booking.project?.location || '',
      plotArea: booking.plotArea,
      pricePerSqft: booking.pricePerSqft,
      plotPrice: booking.plotPrice,
      paidAmount: booking.paidAmount,
      remainingAmount: booking.remainingAmount,
      status: booking.status,
      bookingDate: booking.bookingDate,
      guardianName: booking.guardianName || '',
      siteVisitId: booking.siteVisitId,
      creatorName: booking.creator?.name || '',
      assignedToUserName: booking.assignedToUser?.name || '',
      salesManagerName: booking.assignedToUser?.name || booking.creator?.name || '',
      paymentMode: booking.paymentMode,
      bankName: booking.bankName,
      chequeNo: booking.chequeNo,
      chequeDate: booking.chequeDate,
      transferId: booking.transferId,
      receipts: booking.receipts || [],
    };

    return { customer: customerData, booking: bookingData, receipts: booking.receipts || [] };
  }

  // ─── HELPER ───────────────────────────────────────────────────────────
  private formatBooking(b: any) {
    const projectName = b.project?.name || '';
    const siteNo = b.site?.siteNo || '';
    const projectNo = b.projectId ? `PRJ-${String(b.projectId).padStart(3, '0')}` : '';
    return {
      ...b,
      projectName,
      projectNo,
      siteName: siteNo ? `${projectName} - Site ${siteNo}` : projectName,
      siteNo,
      customerName: b.customer?.name || '',
      creatorName: b.creator?.name || '',
      assignedToUserName: b.assignedToUser?.name || '',
      salesManagerName: b.assignedToUser?.name || b.creator?.name || '',
      receipts: b.receipts || [],
    };
  }
}