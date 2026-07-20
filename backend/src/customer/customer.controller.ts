import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  async register(@Body() createCustomerDto: CreateCustomerDto) {
    const customer = await this.customerService.register(createCustomerDto);
    return customer;
  }

  @Get()
  async findAll() {
    const customers = await this.customerService.findAll();
    return customers;
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