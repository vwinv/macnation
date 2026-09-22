import { Module } from '@nestjs/common';
import { NotifyModule } from '../notify/notify.module';
import { PaytechController } from './paytech.controller';
import { PaytechService } from './paytech.service';

@Module({
  imports: [NotifyModule],
  controllers: [PaytechController],
  providers: [PaytechService],
  exports: [PaytechService],
})
export class PaytechModule {}
