import { Module } from '@nestjs/common';
import { SiteVisitController } from './site-visit.controller';
import { SiteVisitService } from './site-visit.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, WhatsappModule],
  controllers: [SiteVisitController],
  providers: [SiteVisitService],
  exports: [SiteVisitService],
})
export class SiteVisitModule {}
