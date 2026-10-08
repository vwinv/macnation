import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PushController } from './push.controller';
import { PushScheduler } from './push.scheduler';
import { PushService } from './push.service';

@Module({
  imports: [AuthModule],
  controllers: [PushController],
  providers: [PushService, PushScheduler],
  exports: [PushService],
})
export class PushModule {}
