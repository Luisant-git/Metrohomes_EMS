import { Controller, Get, Post, Body, Param, Put, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@ApiTags('Customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  async register(@Body() createCustomerDto: CreateCustomerDto) {
    const customer = await this.customerService.register(createCustomerDto);
    return { success: true, data: customer };
  }

  @Get()
  async findAll() {
    const customers = await this.customerService.findAll();
    return { success: true, data: customers };
  }

  @Get('check-duplicate')
  async checkDuplicate(@Query('mobile') mobile?: string, @Query('email') email?: string) {
    const duplicate = await this.customerService.checkDuplicate(mobile, email);
    if (duplicate) {
      return { success: false, duplicate: true, message: duplicate };
    }
    return { success: true, duplicate: false };
  }

  @Get('find-by-mobile')
  async findByMobile(@Query('mobile') mobile: string) {
    const customer = await this.customerService.findByMobile(mobile);
    if (!customer) {
      return { success: false, message: 'Customer not found' };
    }
    return { success: true, data: customer };
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    const customer = await this.customerService.findOne(id);
    return customer;
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() data: any) {
    const customer = await this.customerService.update(id, data);
    return customer;
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.customerService.remove(id);
    return { success: true };
  }

  // ---------------------------------------------------
  // Customer Mobile Verification OTP endpoints
  // ---------------------------------------------------
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP for customer mobile verification' })
  async requestOtp(@Body('mobile') mobile: string) {
    return this.customerService.requestCustomerOtp(mobile);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP for customer mobile verification' })
  async verifyOtp(@Body('mobile') mobile: string, @Body('otp') otp: string) {
    return this.customerService.verifyCustomerOtp(mobile, otp);
  }
}
