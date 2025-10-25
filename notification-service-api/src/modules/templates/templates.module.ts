import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './core/template.entity';
import { TemplatesService } from './core/templates.service';
import { TemplatesRepository } from './core/templates.repository';
import { TemplatesController } from './web/templates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Template])],
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplatesRepository],
  exports: [TemplatesService],
})
export class TemplatesModule {}
