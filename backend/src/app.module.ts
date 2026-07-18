import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { SiteModule } from './site/site.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, WhatsappModule, DashboardModule, UploadModule, SiteModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
