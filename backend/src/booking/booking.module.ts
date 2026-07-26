import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';

@Module({
  imports: [PrismaModule, WhatsappModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
