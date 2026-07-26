import { Controller, Get, Post, Body, Param, Put, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
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
}
