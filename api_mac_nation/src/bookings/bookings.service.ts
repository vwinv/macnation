import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.service';
import {
  bookingAmount,
  bookingLines,
  formatFcfa,
  isQuotedService,
  parsePaymentMethod,
  type PaymentMethod,
} from '../common/money';
import { isSnMobile, normalizePhone } from '../common/phone';
import {
  durationMinutes,
  generateStarts,
  leadMinutes,
  rangesOverlap,
  slotRange,
  toMinutes,
} from '../common/schedule';
import { NotifyService } from '../notify/notify.service';
import { StoreService } from '../store/store.service';
import type { Client } from '../store/store.types';
import { CreateBookingDto } from './bookings.dto';

function formatDateLabel(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly store: StoreService,
    private readonly catalog: CatalogService,
    private readonly notify: NotifyService,
  ) {}

  async publicSchedule() {
    const schedule = await this.store.getSchedule();
    return {
      hours: schedule.hours,
      closedDates: schedule.closedDates.map((item) => item.dateIso),
    };
  }

  async slots(date: string, serviceId?: string, opts?: { ignoreLead?: boolean }) {
    const day = date.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      throw new UnprocessableEntityException(
        'Indique une date au format AAAA-MM-JJ.',
      );
    }
    const service = serviceId
      ? await this.catalog.service(serviceId.trim())
      : null;
    const durationMin = durationMinutes(service?.duration);
    const dayStatus = await this.store.dayStatus(day);
    if (dayStatus.closed) {
      return {
        date: day,
        closed: true,
        reason: dayStatus.reason,
        durationMin,
        slots: [] as {
          time: string;
          end: string;
          label: string;
          available: boolean;
        }[],
      };
    }
    const occupied = await this.store.occupiedRanges(day);
    const buffer = opts?.ignoreLead ? null : leadMinutes(day);
    const starts = generateStarts(
      dayStatus.hour.openTime,
      dayStatus.hour.closeTime,
      durationMin,
      undefined,
      {
        start: dayStatus.hour.pauseStart,
        end: dayStatus.hour.pauseEnd,
      },
    );
    return {
      date: day,
      closed: false,
      reason: '',
      durationMin,
      slots: starts.map((time) => {
        const start = toMinutes(time);
        const end = start + durationMin;
        const taken = occupied.some((range) =>
          rangesOverlap(start, end, range.start, range.end),
        );
        const tooSoon = buffer != null && start < buffer;
        const range = slotRange(time, durationMin);
        return {
          time,
          end: range.end,
          label: range.label,
          available: !taken && !tooSoon,
        };
      }),
    };
  }

  async create(dto: CreateBookingDto, client?: Client) {
    const name = dto.name.trim();
    const phone = normalizePhone(dto.phone);
    const email = (dto.email || client?.email || '').trim();
    const service = await this.catalog.service(dto.serviceId.trim());
    const dateIso = dto.dateIso.slice(0, 10);
    const time = dto.time;
    const place =
      dto.place === 'domicile' || dto.place === 'home' ? 'domicile' : 'salon';
    const address = (dto.address || '').trim();
    const quoted = isQuotedService(service?.price, service?.priceLabel);
    const payNow = !quoted && dto.payNow === true;
    const paymentMethod = quoted
      ? undefined
      : parsePaymentMethod(dto.paymentMethod);

    if (!name || !phone || !service || !dateIso || !time) {
      throw new UnprocessableEntityException('Informations incomplètes.');
    }
    if (!isSnMobile(phone)) {
      throw new UnprocessableEntityException(
        'Indiquez un numéro sénégalais valide (77, 78, 76, 70…).',
      );
    }
    if (place === 'domicile' && !address && service.id !== 'domicile') {
      throw new UnprocessableEntityException(
        'Adresse requise pour un rendez-vous à domicile.',
      );
    }
    const durationMin = durationMinutes(service.duration);
    const availability = await this.slots(dateIso, service.id);
    if (availability.closed) {
      throw new UnprocessableEntityException(
        availability.reason || 'Le salon est fermé ce jour-là.',
      );
    }
    const chosen = availability.slots.find((slot) => slot.time === time);
    if (!chosen?.available) {
      throw new UnprocessableEntityException(
        'Cette plage n’est plus disponible. Choisis un autre horaire.',
      );
    }

    const dateLabel = dto.dateLabel?.trim() || formatDateLabel(dateIso);
    const note = `${dateLabel} · ${chosen.label} · ${
      place === 'domicile' ? address || 'Domicile' : 'Salon Nord Foire'
    }`;
    const amount = quoted
      ? 0
      : bookingAmount(service.price ?? 0, place, service.id);
    const items = quoted
      ? [{ name: service.name, qty: 1, unitPrice: 0 }]
      : bookingLines(service.name, service.price ?? 0, place, service.id);
    const loggedIn = Boolean(client);
    const ensured = await this.store.ensurePublicClient({
      clientId: client?.id,
      name,
      phone,
      email,
    });
    if (ensured.generatedPassword) {
      await this.notify.accountCreated({
        name,
        phone,
        email,
        password: ensured.generatedPassword,
      });
    }
    const clientId = ensured.id || client?.id;
    const accountCreated = Boolean(ensured.generatedPassword);
    if (dto.useMembership && !loggedIn) {
      throw new UnprocessableEntityException(
        'Connecte-toi pour utiliser ton abonnement.',
      );
    }
    const membership =
      dto.useMembership && client?.id
        ? await this.store.activeMembershipFor(client.id)
        : null;
    if (dto.useMembership && !membership) {
      throw new UnprocessableEntityException(
        'Plus de visites sur ton abonnement.',
      );
    }

    if (membership && !quoted) {
      const created = await this.store.createBooking({
        name,
        phone,
        email,
        serviceId: service.id,
        serviceName: service.name,
        dateIso,
        dateLabel,
        time,
        durationMin,
        place,
        address,
        amount: 0,
        paymentStatus: 'paid',
        paymentMethod: 'autre',
        items: [{ name: `${service.name} · Abonnement ${membership.planName}`, qty: 1, unitPrice: 0 }],
        note: `Abonnement ${membership.planName} · ${note}`,
        clientId: client?.id || clientId,
        confirmed: true,
        consumeMembership: true,
      });
      try {
        await this.notify.bookingCreated({
          name,
          phone,
          email,
          serviceName: service.name,
          dateLabel,
          time,
          place,
          address,
        });
      } catch {
        /* mail best-effort */
      }
      return {
        ok: true as const,
        booking: created.booking,
        invoiceId: created.invoiceId,
        amount: 0,
        paid: true,
        usedMembership: true,
        membership: {
          planName: membership.planName,
          visitsLeft: Math.max(0, membership.visitsTotal - membership.visitsUsed - 1),
          visitsTotal: membership.visitsTotal,
        },
        accountCreated,
        loginRequired: false,
      };
    }

    if (payNow && amount > 0) {
      const created = await this.store.createBooking({
        name,
        phone,
        email,
        serviceId: service.id,
        serviceName: service.name,
        dateIso,
        dateLabel,
        time,
        durationMin,
        place,
        address,
        amount,
        paymentStatus: 'pending',
        paymentMethod,
        items,
        note,
        clientId,
        confirmed: false,
      });
      const pending = await this.store.createPendingPayment({
        amount,
        phone,
        skipSlotCheck: true,
        payload: {
          kind: 'booking',
          name,
          phone,
          email,
          serviceId: service.id,
          serviceName: service.name,
          dateIso,
          dateLabel,
          time,
          durationMin,
          place,
          address,
          amount,
          items,
          note,
          clientId,
          confirmed: loggedIn,
          bookingId: created.booking.id,
          invoiceId: created.invoiceId,
        },
      });
      return {
        ok: true as const,
        booking: created.booking,
        invoiceId: created.invoiceId,
        pendingId: pending.id,
        amount: created.amount,
        paid: false,
        accountCreated,
        loginRequired: !loggedIn,
      };
    }

    const created = await this.store.createBooking({
      name,
      phone,
      email,
      serviceId: service.id,
      serviceName: service.name,
      dateIso,
      dateLabel,
      time,
      durationMin,
      place,
      address,
      amount,
      paymentStatus: 'unpaid',
      paymentMethod,
      items,
      note,
      clientId,
      confirmed: quoted ? false : loggedIn,
    });

    return {
      ok: true as const,
      booking: created.booking,
      invoiceId: created.invoiceId,
      amount: created.amount,
      paid: created.booking.paymentStatus === 'paid',
      accountCreated,
      loginRequired: !loggedIn,
    };
  }

  async createWalkIn(input: {
    name: string;
    phone: string;
    email?: string;
    clientId?: string;
    serviceId: string;
    dateIso: string;
    time: string;
    paymentMethod?: PaymentMethod;
  }) {
    const name = input.name.trim();
    const phone = normalizePhone(input.phone);
    const email = (input.email || '').trim();
    const service = await this.catalog.service(input.serviceId.trim());
    const dateIso = input.dateIso.slice(0, 10);
    const time = input.time;

    if (!name || !phone || !service || !dateIso || !time) {
      throw new UnprocessableEntityException('Informations incomplètes.');
    }
    if (!isSnMobile(phone)) {
      throw new UnprocessableEntityException(
        'Indiquez un numéro sénégalais valide (77, 78, 76, 70…).',
      );
    }

    const quoted = isQuotedService(service.price, service.priceLabel);
    const durationMin = durationMinutes(service.duration);
    const availability = await this.slots(dateIso, service.id, {
      ignoreLead: true,
    });
    if (availability.closed) {
      throw new UnprocessableEntityException(
        availability.reason || 'Le salon est fermé ce jour-là.',
      );
    }
    const chosen = availability.slots.find((slot) => slot.time === time);
    if (!chosen?.available) {
      throw new UnprocessableEntityException(
        'Cette plage n’est plus disponible. Choisis un autre horaire.',
      );
    }

    const dateLabel = formatDateLabel(dateIso);
    const note = `${dateLabel} · ${chosen.label} · Salon Nord Foire`;
    const amount = quoted ? 0 : bookingAmount(service.price ?? 0, 'salon', service.id);
    const items = quoted
      ? [{ name: service.name, qty: 1, unitPrice: 0 }]
      : bookingLines(service.name, service.price ?? 0, 'salon', service.id);

    const ensured = await this.store.ensurePublicClient({
      clientId: input.clientId,
      name,
      phone,
      email,
    });
    if (ensured.generatedPassword) {
      await this.notify.accountCreated({
        name,
        phone,
        email,
        password: ensured.generatedPassword,
      });
    }
    const created = await this.store.createBooking({
      name,
      phone,
      email,
      serviceId: service.id,
      serviceName: service.name,
      dateIso,
      dateLabel,
      time,
      durationMin,
      place: 'salon',
      address: '',
      amount,
      paymentStatus: 'unpaid',
      paymentMethod: input.paymentMethod,
      items,
      note,
      clientId: ensured.id || undefined,
      confirmed: true,
    });

    if (input.paymentMethod && created.invoiceId && created.amount > 0) {
      await this.store.markInvoicePaid({
        invoiceId: created.invoiceId,
        method: input.paymentMethod,
      });
    }
    const booking =
      (await this.store.getBooking(created.booking.id)) || created.booking;

    return {
      ok: true as const,
      booking,
      invoiceId: created.invoiceId,
      amount: created.amount,
    };
  }

  mine(client: Client) {
    return this.store.bookingsForClient(client);
  }

  async acceptQuoteAtSalon(id: string, client: Client) {
    const booking = await this.store.acceptQuoteAtSalon(id, client);
    await this.notify.quoteSalonChosen({
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      serviceName: booking.serviceName,
      dateLabel: booking.dateLabel,
      time: booking.time,
      amountLabel: formatFcfa(booking.amount),
    });
    return booking;
  }

  async cancel(id: string, client: Client) {
    return this.store.cancelClientBooking(id, client);
  }

  async one(id: string, client: Client) {
    const booking = (await this.mine(client)).find((item) => item.id === id);
    if (!booking) throw new NotFoundException('Rendez-vous introuvable.');
    return booking;
  }
}
