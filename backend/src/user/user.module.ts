// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserInactivityScheduler } from './user-inactivity.scheduler';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  providers: [UserService, UserInactivityScheduler],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}