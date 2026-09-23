import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { OptionalAuthGuard } from '../auth/auth.guard';
import { CurrentClient } from '../auth/current-client.decorator';
import { NotifyService } from '../notify/notify.service';
import type { Client } from '../store/store.types';
import type { CreateBookingDto } from './bookings.dto';
import { BookingsService } from './bookings.service';

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Website contract for POST /api/booking. Unlike the mobile route it never fails
 * on missing SMS credentials. « Payer maintenant » n’enregistre le RDV qu’après IPN.
 */
@Controller('booking')
export class BookingAliasController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly notify: NotifyService,
  ) {}

  @Post()
  @HttpCode(200)
  @UseGuards(OptionalAuthGuard)
  async create(@Body() body: unknown, @CurrentClient() client?: Client) {
    const payload = (body || {}) as Record<string, unknown>;
    const place = text(payload.place);
    const dto: CreateBookingDto = {
      name: text(payload.name),
      phone: text(payload.phone),
      email: text(payload.email),
      serviceId: text(payload.serviceId),
      dateLabel: text(payload.dateLabel),
      dateIso: text(payload.dateIso) || text(payload.dateLabel),
      time: text(payload.time),
      place: place === 'domicile' || place === 'home' ? place : 'salon',
      address: text(payload.address),
      payNow: payload.payNow === true || payload.payNow === 'true',
      paymentMethod: text(payload.paymentMethod) || undefined,
      useMembership:
        payload.useMembership === true || payload.useMembership === 'true',
    };

    const created = await this.bookings.create(dto, client);

    if (created.booking && !created.usedMembership) {
      await this.notify.bookingCreated({
        name: created.booking.name,
        phone: created.booking.phone,
        email: created.booking.email,
        serviceName: created.booking.serviceName,
        dateLabel: created.booking.dateLabel,
        time: created.booking.time,
        place: created.booking.place,
        address: created.booking.address,
        quoted: created.amount === 0,
      });
    }

    return {
      ok: true,
      invoiceId: created.invoiceId || undefined,
      pendingId: created.pendingId,
      amount: created.amount,
      usedMembership: created.usedMembership || undefined,
      membership: created.membership,
      accountCreated: created.accountCreated || undefined,
      loginRequired: created.loginRequired || undefined,
    };
  }
}
