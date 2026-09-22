import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { AuthModule } from '../auth/auth.module';
import { NotifyModule } from '../notify/notify.module';
import { BookingAliasController } from './booking-alias.controller';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [AuthModule, NotifyModule, CatalogModule],
  controllers: [BookingsController, BookingAliasController],
  providers: [BookingsService],
})
export class BookingsModule {}
