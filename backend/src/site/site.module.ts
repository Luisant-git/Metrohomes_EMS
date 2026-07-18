// src/site/site.module.ts
import { Module } from '@nestjs/common';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';

@Module({
    imports: [],
    providers: [SiteService],
    controllers: [SiteController],
    exports: [SiteService],
})
export class SiteModule { }