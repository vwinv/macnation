import { Module } from '@nestjs/common';
import { NotifyModule } from '../notify/notify.module';
import { ContactController } from './contact.controller';

@Module({
  imports: [NotifyModule],
  controllers: [ContactController],
})
export class ContactModule {}
