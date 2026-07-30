import { Controller, Get, Post, Body, Param, Put, Delete, Query, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking' })
  async create(@Body() createBookingDto: CreateBookingDto) {
    const booking = await this.bookingService.create(createBookingDto);
    return { success: true, data: booking };
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings' })
  async findAll() {
    const bookings = await this.bookingService.findAll();
    return { success: true, data: bookings };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get booking statistics' })
  async getStats() {
    const stats = await this.bookingService.getStats();
    return { success: true, data: stats };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  async findOne(@Param('id') id: number) {
    const booking = await this.bookingService.findOne(id);
    return { success: true, data: booking };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update booking' })
  async update(@Param('id') id: number, @Body() data: any) {
    const booking = await this.bookingService.update(id, data);
    return { success: true, data: booking };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete booking' })
  async remove(@Param('id') id: number) {
    const result = await this.bookingService.remove(id);
    return result;
  }

  @Get('receipts/:id/pdf')
  @ApiOperation({ summary: 'Download receipt as PDF' })
  async downloadReceiptPdf(@Param('id') id: number, @Res() res: any) {
    const filePath = await this.bookingService.downloadReceiptPdf(Number(id));
    const filename = filePath.split(/[\\/]/).pop() || 'receipt.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const { createReadStream } = await import('fs');
    const stream = createReadStream(filePath);
    stream.pipe(res);
  }

  @Post('receipts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create payment receipt' })
  async createReceipt(@Body() body: { bookingId: number; amount: number; paymentMode: string; bankName?: string; chequeNo?: string; chequeDate?: string; transferId?: string }) {
    const receipt = await this.bookingService.createReceipt(
      body.bookingId,
      body.amount,
      body.paymentMode,
      body.bankName,
      body.chequeNo,
      body.chequeDate,
      body.transferId,
    );
    return { success: true, data: receipt };
  }

  @Get('mobile/:mobile')
  @ApiOperation({ summary: 'Find booking by customer mobile number' })
  async findByMobile(@Param('mobile') mobile: string) {
    const result = await this.bookingService.findByMobile(mobile);
    return { success: true, data: result };
  }

  @Post('receipts/:id/send-whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend WhatsApp notification for a receipt' })
  async sendReceiptWhatsApp(@Param('id') id: number) {
    const result = await this.bookingService.sendReceiptWhatsApp(id);
    return { success: true, data: result };
  }

  @Post('debug-whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Debug: send a test WhatsApp template to verify config/templates' })
  async debugWhatsApp(@Body() body: { to?: string; templateName?: 'plot_booking_receipt_v1' | 'payment_receipt' }) {
    const to = body?.to || process.env.WHATSAPP_TEST_NUMBER || '';
    const templateName = body?.templateName || 'plot_booking_receipt_v1';
    if (!to) {
      return { success: false, message: 'Missing recipient number. Pass "to" in body or set WHATSAPP_TEST_NUMBER in backend/.env' };
    }
    const result = await this.bookingService.debugWhatsApp(to, templateName);
    return { success: true, data: result };
  }
}
