import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

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
}