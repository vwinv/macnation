import { Module } from '@nestjs/common';
import { NotifyModule } from '../notify/notify.module';
import { CareerController } from './career.controller';

@Module({
  imports: [NotifyModule],
  controllers: [CareerController],
})
export class CareerModule {}
