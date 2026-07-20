// src/customer/customer.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
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
}
