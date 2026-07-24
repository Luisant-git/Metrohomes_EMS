import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { SiteVisitService } from './site-visit.service';
import { CreateSiteVisitDto } from './dto/create-site-visit.dto';

@Controller('site-visits')
export class SiteVisitController {
  constructor(private readonly siteVisitService: SiteVisitService) {}

  @Post()
  async create(@Body() dto: CreateSiteVisitDto) {
    const visit = await this.siteVisitService.create(dto);
    return { success: true, data: visit };
  }

  @Get()
  async findAll() {
    const visits = await this.siteVisitService.findAll();
    return { success: true, data: visits };
  }

  @Get('by-customer/:customerId')
  async findByCustomer(@Param('customerId') customerId: number) {
    const visits = await this.siteVisitService.findByCustomer(customerId);
    return { success: true, data: visits };
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    const visit = await this.siteVisitService.findOne(id);
    return { success: true, data: visit };
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() data: any) {
    const visit = await this.siteVisitService.update(id, data);
    return { success: true, data: visit };
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.siteVisitService.remove(id);
    return { success: true };
  }
}