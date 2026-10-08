import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { addDaysIso, dakarDateIso } from '../common/dakar-date';
import { PushService } from './push.service';

@Injectable()
export class PushScheduler {
  private readonly logger = new Logger(PushScheduler.name);

  constructor(private readonly push: PushService) {}

  @Cron('0 9 * * *', { timeZone: 'Africa/Dakar' })
  async bookingReminders() {
    const today = dakarDateIso();
    const tomorrow = addDaysIso(today, 1);
    const result = await this.push.sendRemindersForDate(today, tomorrow);
    this.logger.log(
      `Rappels RDV ${today} : veille ${result.eve}, jour J ${result.day}`,
    );
  }
}
