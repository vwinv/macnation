import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import { basename, join } from 'path';
import type {
  Application as ApplicationRow,
  Booking as BookingRow,
  Client as ClientRow,
  Expense as ExpenseRow,
  Invoice as InvoiceRow,
  LoyaltyEvent as LoyaltyRow,
  Membership as MembershipRow,
  Payment as PaymentRow,
} from '@prisma/client';
import { InvoiceKind as PrismaInvoiceKind, Prisma } from '@prisma/client';
import { addDays, planPerks, pointsForAmount } from '../common/loyalty';
import {
  asInvoiceLines,
  bookingLines,
  DOMICILE_FEE,
  formatFcfa,
  invoiceTotal,
  type ExpenseCategory,
  type InvoiceLine,
  type PaymentMethod,
} from '../common/money';
import { generatePassword, hashPassword } from '../common/password';
import { isSnMobile, normalizePhone } from '../common/phone';
import {
  careerFolder,
  configureCloudinary,
  uploadCareerFile,
} from '../common/cloudinary';
import {
  DEFAULT_DURATION_MIN,
  DEFAULT_OPENING_HOURS,
  durationMinutes,
  isHhmm,
  normalizePause,
  rangesOverlap,
  toMinutes,
  type OpeningHourInput,
} from '../common/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type {
  Application,
  ApplicationStatus,
  Booking,
  BookingStatus,
  Client,
  Expense,
  Invoice,
  InvoiceStatus,
  LoyaltyEvent,
  MarkPaidResult,
  Membership,
  OauthProvider,
  Payment,
  PendingPayload,
  PendingPayment,
  PublicClient,
  SalonSnapshot,
  UploadedDocument,
} from './store.types';

type BookingWithInvoice = BookingRow & {
  invoice?: { id: string; note?: string | null } | null;
};

const PENDING_TTL_MS = 45 * 60 * 1000;

function uniquePaytechRef(seed: string) {
  const compact = seed.replace(/[^a-zA-Z0-9]/g, '').slice(-16);
  return `MN${compact}${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
}

function pendingBookingHold(
  payload: unknown,
): { dateIso: string; time: string; durationMin: number } | null {
  if (!payload || typeof payload !== 'object') return null;
  const row = payload as {
    kind?: unknown;
    dateIso?: unknown;
    time?: unknown;
    durationMin?: unknown;
  };
  if (row.kind !== 'booking') return null;
  const dateIso = typeof row.dateIso === 'string' ? row.dateIso.slice(0, 10) : '';
  const time = typeof row.time === 'string' ? row.time : '';
  if (!dateIso || !time) return null;
  return {
    dateIso,
    time,
    durationMin: durationMinutes(
      typeof row.durationMin === 'number' || typeof row.durationMin === 'string'
        ? row.durationMin
        : DEFAULT_DURATION_MIN,
    ),
  };
}

/**
 * Client.phone is unique and non-null, so social sign-ups that have no phone yet
 * get a sentinel value. It is never exposed: publicClient() reports an empty phone.
 */
const PENDING_PHONE_PREFIX = 'pending:';

const OAUTH_FIELD: Record<
  OauthProvider,
  'googleId' | 'appleId' | 'facebookId'
> = {
  google: 'googleId',
  apple: 'appleId',
  facebook: 'facebookId',
};

function applicationsDir() {
  return join(process.cwd(), 'uploads', 'applications');
}

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  publicClient(client: Client): PublicClient {
    const providers: OauthProvider[] = [];
    if (client.googleId) providers.push('google');
    if (client.appleId) providers.push('apple');
    if (client.facebookId) providers.push('facebook');
    return {
      id: client.id,
      createdAt: client.createdAt,
      name: client.name,
      phone: client.phone.startsWith(PENDING_PHONE_PREFIX) ? '' : client.phone,
      email: client.email,
      points: client.points,
      creditFcfa: client.creditFcfa,
      providers,
      hasPassword: Boolean(client.passwordHash),
    };
  }

  async findClient(id: string) {
    const row = await this.prisma.client.findUnique({ where: { id } });
    return row ? this.toClient(row) : undefined;
  }

  async findClientByPhone(phone: string) {
    const row = await this.prisma.client.findUnique({
      where: { phone: normalizePhone(phone) },
    });
    return row ? this.toClient(row) : undefined;
  }

  async createClient(input: {
    name: string;
    phone: string;
    email: string;
    passwordHash: string;
  }) {
    try {
      const row = await this.prisma.client.create({
        data: {
          name: input.name,
          phone: input.phone,
          email: input.email,
          passwordHash: input.passwordHash,
        },
      });
      await this.linkClientHistory(row.id, row.phone);
      return this.toClient(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ce numéro a déjà un compte. Connecte-toi.',
        );
      }
      throw error;
    }
  }

  async occupiedRanges(dateIso: string) {
    const day = dateIso.slice(0, 10);
    const [rows, holds] = await Promise.all([
      this.prisma.booking.findMany({
        where: { dateIso: day, status: { not: 'annule' } },
        select: { time: true, durationMin: true },
      }),
      this.prisma.pendingPayment.findMany({
        where: {
          kind: 'booking',
          status: 'pending',
          expiresAt: { gt: new Date() },
        },
        select: { payload: true },
      }),
    ]);
    const ranges: { start: number; end: number }[] = [];
    for (const item of rows) {
      const start = toMinutes(item.time);
      if (!Number.isFinite(start)) continue;
      ranges.push({
        start,
        end: start + (item.durationMin || DEFAULT_DURATION_MIN),
      });
    }
    for (const hold of holds) {
      const slot = pendingBookingHold(hold.payload);
      if (!slot || slot.dateIso !== day) continue;
      const start = toMinutes(slot.time);
      if (!Number.isFinite(start)) continue;
      ranges.push({ start, end: start + slot.durationMin });
    }
    return ranges;
  }

  async slotTaken(dateIso: string, time: string, durationMin: number) {
    const start = toMinutes(time);
    if (!Number.isFinite(start)) return true;
    const end = start + durationMin;
    const occupied = await this.occupiedRanges(dateIso);
    return occupied.some((range) =>
      rangesOverlap(start, end, range.start, range.end),
    );
  }

  async getSchedule() {
    const [hours, closedDates] = await Promise.all([
      this.prisma.openingHour.findMany(),
      this.prisma.closedDate.findMany({ orderBy: { dateIso: 'asc' } }),
    ]);
    const byWeekday = new Map(hours.map((row) => [row.weekday, row]));
    const ordered = DEFAULT_OPENING_HOURS.map((fallback) => {
      const row = byWeekday.get(fallback.weekday);
      return {
        weekday: fallback.weekday,
        closed: row?.closed ?? fallback.closed,
        openTime: row?.openTime ?? fallback.openTime,
        closeTime: row?.closeTime ?? fallback.closeTime,
        pauseStart: row?.pauseStart ?? null,
        pauseEnd: row?.pauseEnd ?? null,
      };
    }).sort((a, b) => {
      const rank = (n: number) => (n === 0 ? 7 : n);
      return rank(a.weekday) - rank(b.weekday);
    });
    return { hours: ordered, closedDates };
  }

  async saveHours(hours: OpeningHourInput[]) {
    if (!Array.isArray(hours) || hours.length === 0) {
      throw new UnprocessableEntityException('Indique les horaires de la semaine.');
    }
    for (const row of hours) {
      if (!Number.isInteger(row.weekday) || row.weekday < 0 || row.weekday > 6) {
        throw new UnprocessableEntityException('Jour invalide.');
      }
      if (!row.closed) {
        if (
          !isHhmm(row.openTime) ||
          !isHhmm(row.closeTime) ||
          toMinutes(row.closeTime) <= toMinutes(row.openTime)
        ) {
          throw new UnprocessableEntityException(
            'Heures d’ouverture invalides (fermeture après ouverture).',
          );
        }
      }
      const pause = normalizePause(row.pauseStart, row.pauseEnd);
      if (pause.invalid) {
        throw new UnprocessableEntityException(
          'Horaires de pause invalides (fin après le début).',
        );
      }
      if (!row.closed && pause.pauseStart && pause.pauseEnd) {
        const open = toMinutes(row.openTime);
        const close = toMinutes(row.closeTime);
        const pauseStart = toMinutes(pause.pauseStart);
        const pauseEnd = toMinutes(pause.pauseEnd);
        if (pauseStart < open || pauseEnd > close) {
          throw new UnprocessableEntityException(
            'La pause doit être comprise dans les heures d’ouverture.',
          );
        }
      }
      const pauseStart = row.closed ? null : pause.pauseStart;
      const pauseEnd = row.closed ? null : pause.pauseEnd;
      await this.prisma.openingHour.upsert({
        where: { weekday: row.weekday },
        create: {
          weekday: row.weekday,
          closed: row.closed,
          openTime: row.openTime || '10:00',
          closeTime: row.closeTime || '21:00',
          pauseStart,
          pauseEnd,
        },
        update: {
          closed: row.closed,
          openTime: row.openTime || '10:00',
          closeTime: row.closeTime || '21:00',
          pauseStart,
          pauseEnd,
        },
      });
    }
    return this.getSchedule();
  }

  async addClosedDate(dateIso: string, note = '') {
    const day = dateIso.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      throw new UnprocessableEntityException(
        'Indique une date au format AAAA-MM-JJ.',
      );
    }
    try {
      await this.prisma.closedDate.create({
        data: { dateIso: day, note: note.trim() },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Cette date est déjà marquée fermée.');
      }
      throw err;
    }
    return this.getSchedule();
  }

  async removeClosedDate(id: string) {
    if (!id) throw new NotFoundException('Fermeture introuvable.');
    try {
      await this.prisma.closedDate.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Fermeture introuvable.');
    }
    return this.getSchedule();
  }

  async dayStatus(dateIso: string) {
    const day = dateIso.slice(0, 10);
    const schedule = await this.getSchedule();
    const weekday = new Date(`${day}T12:00:00`).getDay();
    const hour =
      schedule.hours.find((item) => item.weekday === weekday) ||
      DEFAULT_OPENING_HOURS.find((item) => item.weekday === weekday)!;
    const closedDate = schedule.closedDates.find((item) => item.dateIso === day);
    if (closedDate) {
      return {
        closed: true as const,
        reason: closedDate.note || 'Fermé exceptionnellement',
        hour,
      };
    }
    if (hour.closed) {
      return { closed: true as const, reason: 'Fermé', hour };
    }
    return { closed: false as const, reason: '', hour };
  }

  async createBooking(input: {
    name: string;
    phone: string;
    email: string;
    serviceId: string;
    serviceName: string;
    dateIso: string;
    dateLabel: string;
    time: string;
    durationMin: number;
    place: 'salon' | 'domicile';
    address: string;
    amount: number;
    paymentStatus: 'unpaid' | 'pending' | 'paid';
    paymentMethod?: PaymentMethod;
    items: InvoiceLine[];
    note: string;
    clientId?: string;
    confirmed?: boolean;
    ignoreHolds?: boolean;
    consumeMembership?: boolean;
  }) {
    const durationMin = Math.max(5, input.durationMin || DEFAULT_DURATION_MIN);
    if (
      !input.ignoreHolds &&
      (await this.slotTaken(input.dateIso, input.time, durationMin))
    ) {
      throw new UnprocessableEntityException(
        'Cette plage vient d’être prise. Choisis un autre horaire.',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const start = toMinutes(input.time);
      if (!Number.isFinite(start)) {
        throw new UnprocessableEntityException('Créneau invalide.');
      }
      const end = start + durationMin;
      const sameDay = await tx.booking.findMany({
        where: { dateIso: input.dateIso, status: { not: 'annule' } },
        select: { time: true, durationMin: true },
      });
      const overlap = sameDay.some((row) => {
        const otherStart = toMinutes(row.time);
        if (!Number.isFinite(otherStart)) return false;
        return rangesOverlap(
          start,
          end,
          otherStart,
          otherStart + (row.durationMin || DEFAULT_DURATION_MIN),
        );
      });
      if (overlap) {
        throw new UnprocessableEntityException(
          'Cette plage vient d’être prise. Choisis un autre horaire.',
        );
      }

      const ensured = await this.ensureClient(tx, {
        clientId: input.clientId,
        name: input.name,
        phone: input.phone,
        email: input.email,
      });
      const clientId = ensured.id;
      if (input.consumeMembership) {
        if (!clientId) {
          throw new UnprocessableEntityException(
            'Connecte-toi pour utiliser ton abonnement.',
          );
        }
        await this.takeMembershipVisit(tx, clientId);
      }
      const makeInvoice = input.amount > 0;
      const booking = await tx.booking.create({
        data: {
          name: input.name,
          phone: input.phone,
          email: input.email,
          serviceId: input.serviceId,
          serviceName: input.serviceName,
          dateIso: input.dateIso,
          dateLabel: input.dateLabel,
          time: input.time,
          durationMin,
          place: input.place,
          address: input.address,
          amount: input.amount,
          paymentStatus: input.paymentStatus,
          ...(input.paymentMethod ? { paymentMethod: input.paymentMethod } : {}),
          status: input.confirmed ? 'confirme' : 'nouveau',
          clientId: clientId || undefined,
          ...(makeInvoice
            ? {
                invoice: {
                  create: {
                    number: await this.nextInvoiceNumber(tx),
                    clientName: input.name,
                    clientPhone: input.phone,
                    clientEmail: input.email,
                    items: input.items,
                    amount: invoiceTotal(input.items),
                    note: input.note,
                    kind: 'rdv',
                    clientId: clientId || undefined,
                    paymentMethod: input.paymentMethod,
                  },
                },
              }
            : {}),
        },
        include: { invoice: true },
      });

      const mapped = this.toBooking(booking);
      mapped.amount = booking.invoice?.amount ?? mapped.amount;
      return {
        booking: mapped,
        invoiceId: booking.invoice?.id || '',
        amount: booking.invoice?.amount ?? mapped.amount,
        generatedPassword: ensured.generatedPassword,
      };
    });
  }

  async createCheckout(input: {
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    items: InvoiceLine[];
    note: string;
    kind: 'boutique' | 'abonnement';
    clientId?: string;
    planId?: string;
    paymentMethod: PaymentMethod;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const ensured = await this.ensureClient(tx, {
        clientId: input.clientId,
        name: input.clientName,
        phone: input.clientPhone,
        email: input.clientEmail,
      });
      const clientId = ensured.id || undefined;
      const number = await this.nextInvoiceNumber(tx);
      const invoice = await tx.invoice.create({
        data: {
          number,
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          clientEmail: input.clientEmail,
          items: input.items,
          amount: invoiceTotal(input.items),
          note: input.note,
          kind: input.kind,
          clientId,
          planId: input.planId,
          paymentMethod: input.paymentMethod,
        },
      });

      let membership: Membership | null = null;
      if (input.kind === 'abonnement' && clientId && input.planId) {
        membership = await this.activateMembership(
          tx,
          clientId,
          input.planId,
          invoice.id,
        );
      }

      return {
        invoice: this.toInvoice(invoice),
        membership,
        generatedPassword: ensured.generatedPassword,
      };
    });
  }

  async createPendingPayment(input: {
    payload: PendingPayload;
    amount: number;
    phone: string;
    skipSlotCheck?: boolean;
  }) {
    if (input.payload.kind === 'booking' && !input.skipSlotCheck) {
      const taken = await this.slotTaken(
        input.payload.dateIso,
        input.payload.time,
        input.payload.durationMin || DEFAULT_DURATION_MIN,
      );
      if (taken) {
        throw new UnprocessableEntityException(
          'Cette plage vient d’être prise. Choisis un autre horaire.',
        );
      }
    }
    const row = await this.prisma.pendingPayment.create({
      data: {
        kind: input.payload.kind,
        amount: input.amount,
        payload: input.payload as unknown as Prisma.InputJsonValue,
        phone: input.phone,
        paytechRef: uniquePaytechRef(randomUUID()),
        expiresAt: new Date(Date.now() + PENDING_TTL_MS),
      },
    });
    return this.toPending(row);
  }

  async getPendingPayment(id: string) {
    if (!id) return null;
    const row = await this.prisma.pendingPayment.findUnique({ where: { id } });
    return row ? this.toPending(this.expireIfNeeded(row)) : null;
  }

  async attachPaytechPending(
    pendingId: string,
    token: string,
    url: string,
    ref: string,
  ) {
    const row = await this.prisma.pendingPayment.update({
      where: { id: pendingId },
      data: { paytechToken: token, paytechUrl: url, paytechRef: ref },
    });
    return this.toPending(row);
  }

  async rotatePendingRef(pendingId: string) {
    const ref = uniquePaytechRef(pendingId);
    const row = await this.prisma.pendingPayment.update({
      where: { id: pendingId },
      data: { paytechRef: ref },
    });
    return this.toPending(row);
  }

  async fulfillPendingPayment(opts: {
    pendingId?: string;
    paytechRef?: string;
    token?: string;
    method: PaymentMethod;
  }): Promise<(MarkPaidResult & { pending: PendingPayment }) | null> {
    const row = await this.findPendingRow(opts);
    if (!row) return null;
    const pending = this.toPending(this.expireIfNeeded(row));
    if (pending.status === 'paid' && pending.invoiceId) {
      const paid = await this.markInvoicePaid({
        invoiceId: pending.invoiceId,
        paydunyaToken: opts.token,
        method: opts.method,
      });
      return paid ? { ...paid, pending } : null;
    }

    const payload = pending.payload;
    if (payload.kind === 'booking') {
      let invoiceId = payload.invoiceId || '';
      let generatedPassword: string | undefined;
      if (invoiceId) {
        const existing = await this.getInvoice(invoiceId);
        if (!existing) invoiceId = '';
      }
      if (!invoiceId) {
        const created = await this.createBooking({
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          serviceId: payload.serviceId,
          serviceName: payload.serviceName,
          dateIso: payload.dateIso,
          dateLabel: payload.dateLabel,
          time: payload.time,
          durationMin: payload.durationMin || DEFAULT_DURATION_MIN,
          place: payload.place,
          address: payload.address,
          amount: payload.amount,
          paymentStatus: 'pending',
          paymentMethod: opts.method,
          items: payload.items,
          note: payload.note,
          clientId: payload.clientId,
          confirmed: true,
          ignoreHolds: true,
        });
        invoiceId = created.invoiceId;
        generatedPassword = created.generatedPassword;
      }
      const settled = await this.markInvoicePaid({
        invoiceId,
        paydunyaToken: opts.token,
        method: opts.method,
      });
      if (!settled) return null;
      await this.prisma.pendingPayment.update({
        where: { id: pending.id },
        data: { status: 'paid', invoiceId },
      });
      return {
        ...settled,
        pending: { ...pending, status: 'paid', invoiceId },
        generatedPassword,
      };
    }

    const created = await this.createCheckout({
      clientName: payload.clientName,
      clientPhone: payload.clientPhone,
      clientEmail: payload.clientEmail,
      items: payload.items,
      note: payload.note,
      kind: payload.kind,
      clientId: payload.clientId,
      planId: payload.planId,
      paymentMethod: opts.method,
    });
    const settled = await this.markInvoicePaid({
      invoiceId: created.invoice.id,
      paydunyaToken: opts.token,
      method: opts.method,
    });
    if (!settled) return null;
    await this.prisma.pendingPayment.update({
      where: { id: pending.id },
      data: { status: 'paid', invoiceId: created.invoice.id },
    });
    return {
      ...settled,
      pending: { ...pending, status: 'paid', invoiceId: created.invoice.id },
      generatedPassword: created.generatedPassword,
    };
  }

  async bookingsForClient(client: Client) {
    const phone = isSnMobile(client.phone) ? normalizePhone(client.phone) : '';
    const rows = await this.prisma.booking.findMany({
      where: {
        OR: [
          { clientId: client.id },
          ...(phone ? [{ phone }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { invoice: true },
    });
    return rows.map((row) => this.toBooking(row));
  }

  async invoicesForClient(client: Client) {
    const phone = isSnMobile(client.phone) ? normalizePhone(client.phone) : '';
    const rows = await this.prisma.invoice.findMany({
      where: {
        OR: [
          { clientId: client.id },
          ...(phone ? [{ clientPhone: phone }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toInvoice(row));
  }

  async dashboard(client: Client) {
    await this.activateClientSession(client);
    await this.refreshMemberships(client.id);
    const fresh = (await this.findClient(client.id)) || client;
    const [memberships, loyalty, bookings, invoices] = await Promise.all([
      this.prisma.membership.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loyaltyEvent.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.bookingsForClient(fresh),
      this.invoicesForClient(fresh),
    ]);
    const mappedMemberships = memberships.map((item) =>
      this.toMembership(item),
    );
    return {
      client: this.publicClient(fresh),
      membership:
        mappedMemberships.find((item) => item.status === 'actif') || null,
      memberships: mappedMemberships,
      loyalty: loyalty.map((item) => this.toLoyalty(item)),
      bookings,
      invoices,
    };
  }

  async updateClient(
    clientId: string,
    patch: { name?: string; email?: string; passwordHash?: string; phone?: string },
  ) {
    const current = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!current) throw new NotFoundException('Compte introuvable.');
    try {
      const row = await this.prisma.client.update({
        where: { id: clientId },
        data: {
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.email !== undefined ? { email: patch.email } : {}),
          ...(patch.passwordHash ? { passwordHash: patch.passwordHash } : {}),
          ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
        },
      });
      if (patch.phone) await this.linkClientHistory(row.id, row.phone);
      return this.publicClient(this.toClient(row));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ce numéro a déjà un compte.');
      }
      throw error;
    }
  }

  async redeem(clientId: string, points: number, creditFcfa: number) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.client.findUnique({ where: { id: clientId } });
      if (!current) throw new NotFoundException('Compte introuvable.');
      if (current.points < points) {
        throw new UnprocessableEntityException(
          `Il te faut ${points} points pour ${formatFcfa(creditFcfa)} de crédit salon.`,
        );
      }
      const row = await tx.client.update({
        where: { id: clientId },
        data: {
          points: { decrement: points },
          creditFcfa: { increment: creditFcfa },
        },
      });
      await tx.loyaltyEvent.create({
        data: {
          clientId,
          kind: 'redeem',
          points: -points,
          creditFcfa,
          label: `Échange ${points} pts · ${formatFcfa(creditFcfa)} de crédit`,
        },
      });
      return this.publicClient(this.toClient(row));
    });
  }

  async cancelMembership(clientId: string) {
    await this.refreshMemberships(clientId);
    const membership = await this.prisma.membership.findFirst({
      where: { clientId, status: 'actif' },
    });
    if (!membership) {
      throw new NotFoundException('Aucun abonnement actif.');
    }
    const row = await this.prisma.membership.update({
      where: { id: membership.id },
      data: { status: 'annule' },
    });
    return this.toMembership(row);
  }

  async loginOrRegisterOAuth(input: {
    provider: OauthProvider;
    providerId: string;
    email: string;
    name: string;
  }) {
    const field = OAUTH_FIELD[input.provider];
    const email = input.email.trim();
    const name = input.name.trim();
    return this.prisma.$transaction(async (tx) => {
      let row = await tx.client.findFirst({
        where: { [field]: input.providerId },
      });
      if (!row && email) {
        row = await tx.client.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
        });
      }
      if (!row) {
        row = await tx.client.create({
          data: {
            name: name || 'Client MAC NATION',
            phone: `${PENDING_PHONE_PREFIX}${input.provider}:${input.providerId}`,
            email,
            passwordHash: '',
            [field]: input.providerId,
          },
        });
      } else {
        row = await tx.client.update({
          where: { id: row.id },
          data: {
            [field]: input.providerId,
            ...(name && (!row.name || row.name === 'Client MAC NATION')
              ? { name }
              : {}),
            ...(email && !row.email ? { email } : {}),
          },
        });
      }
      return this.publicClient(this.toClient(row));
    });
  }

  async forgetFacebookUser(facebookUserId: string) {
    const row = await this.prisma.client.findFirst({
      where: { facebookId: facebookUserId },
    });
    if (!row) return false;
    const facebookOnly =
      !row.passwordHash && row.phone.startsWith(PENDING_PHONE_PREFIX);
    await this.prisma.client.update({
      where: { id: row.id },
      data: facebookOnly
        ? {
            facebookId: null,
            googleId: null,
            appleId: null,
            name: 'Compte supprimé',
            email: '',
            passwordHash: '',
            phone: `${PENDING_PHONE_PREFIX}deleted:${row.id}`,
          }
        : { facebookId: null },
    });
    return true;
  }

  async getInvoice(id: string) {
    if (!id) return null;
    const row = await this.prisma.invoice.findUnique({ where: { id } });
    return row ? this.toInvoice(row) : null;
  }

  async getBooking(id: string) {
    if (!id) return null;
    const row = await this.prisma.booking.findUnique({
      where: { id },
      include: { invoice: true },
    });
    return row ? this.toBooking(row) : null;
  }

  async getInvoiceByToken(token: string) {
    if (!token) return null;
    const row = await this.prisma.invoice.findFirst({
      where: { paydunyaToken: token },
    });
    return row ? this.toInvoice(row) : null;
  }

  async attachPaydunya(invoiceId: string, token: string, url: string) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!current) return null;
      const row = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paydunyaToken: token,
          paydunyaUrl: url,
          ...(current.status === 'payee' ? {} : { status: 'envoyee' }),
        },
      });
      if (row.bookingId) {
        await tx.booking.updateMany({
          where: { id: row.bookingId, paymentStatus: 'unpaid' },
          data: { paymentStatus: 'pending' },
        });
      }
      return this.toInvoice(row);
    });
  }

  async markInvoicePaid(opts: {
    invoiceId?: string;
    paydunyaToken?: string;
    method: PaymentMethod;
    amount?: number;
    note?: string;
  }): Promise<MarkPaidResult | null> {
    return this.prisma.$transaction(async (tx) => {
      const current = await this.findInvoiceRow(tx, opts);
      if (!current) return null;

      if (current.status === 'payee') {
        const existing = await tx.payment.findFirst({
          where: { invoiceId: current.id, status: 'completed' },
          orderBy: { createdAt: 'desc' },
        });
        return {
          invoice: this.toInvoice(current),
          payment: existing ? this.toPayment(existing) : null,
          membership: null,
          created: false,
        };
      }

      const row = await tx.invoice.update({
        where: { id: current.id },
        data: {
          status: 'payee',
          paidAt: new Date(),
          paymentMethod: opts.method,
          ...(opts.paydunyaToken ? { paydunyaToken: opts.paydunyaToken } : {}),
        },
      });

      const payment = await tx.payment.create({
        data: {
          invoiceId: row.id,
          bookingId: row.bookingId,
          amount: opts.amount ?? row.amount,
          method: opts.method,
          status: 'completed',
          note: opts.note,
          paydunyaToken: opts.paydunyaToken || row.paydunyaToken,
        },
      });

      if (row.bookingId) {
        await tx.booking.update({
          where: { id: row.bookingId },
          data: { paymentStatus: 'paid', status: 'confirme' },
        });
      }

      const membership = await this.awardPaidInvoice(tx, row);

      return {
        invoice: this.toInvoice(row),
        payment: this.toPayment(payment),
        membership,
        created: true,
      };
    });
  }

  async listBookings() {
    const rows = await this.prisma.booking.findMany({
      orderBy: [{ dateIso: 'asc' }, { time: 'asc' }, { createdAt: 'asc' }],
      include: { invoice: true },
    });
    return rows.map((row) => this.toBooking(row));
  }

  async updateBookingStatus(id: string, status: BookingStatus) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({ where: { id } });
      if (!current) return null;
      const row = await tx.booking.update({
        where: { id },
        data: { status },
        include: { invoice: true },
      });
      if (status === 'termine' && !this.isMembershipBooking(row)) {
        await this.consumeMembershipVisit(tx, row);
      }
      if (status === 'annule') {
        if (this.isMembershipBooking(current)) {
          await this.restoreMembershipVisit(tx, current.clientId, current.phone);
        }
      }
      if (status === 'annule' && row.invoice) {
        await tx.invoice.updateMany({
          where: { id: row.invoice.id, status: { not: 'payee' } },
          data: { status: 'annulee' },
        });
      }
      return this.toBooking(row);
    });
  }

  async invoiceForBooking(bookingId: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { invoice: true },
      });
      if (!booking) return null;
      if (booking.invoice) return this.toInvoice(booking.invoice);
      if (booking.amount <= 0) return null;

      const clientId =
        booking.clientId ||
        (await this.resolveClient(tx, undefined, booking.phone))?.id;
      const home =
        booking.place === 'domicile' && booking.serviceId !== 'domicile';
      const unitPrice = home
        ? Math.max(0, booking.amount - DOMICILE_FEE)
        : booking.amount;
      const items = bookingLines(
        booking.serviceName,
        unitPrice,
        booking.place,
        booking.serviceId,
      );
      const number = await this.nextInvoiceNumber(tx);
      const row = await tx.invoice.create({
        data: {
          number,
          bookingId: booking.id,
          clientName: booking.name,
          clientPhone: booking.phone,
          clientEmail: booking.email,
          items: items,
          amount: invoiceTotal(items),
          note: `${booking.dateLabel} · ${booking.time}`,
          kind: 'rdv',
          clientId,
          paymentMethod: booking.paymentMethod,
        },
      });
      await tx.booking.update({
        where: { id: booking.id },
        data: { amount: row.amount },
      });
      return this.toInvoice(row);
    });
  }

  async createWalkInInvoice(input: {
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    items: InvoiceLine[];
    note?: string;
    kind?: PrismaInvoiceKind;
    clientId?: string;
    planId?: string;
  }) {
    const items = input.items.filter(
      (line) => line.name.trim() && line.qty > 0,
    );
    const amount = invoiceTotal(items);
    return this.prisma.$transaction(async (tx) => {
      const clientId =
        input.clientId ||
        (await this.resolveClient(tx, undefined, input.clientPhone))?.id;
      const number = await this.nextInvoiceNumber(tx);
      const row = await tx.invoice.create({
        data: {
          number,
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          clientEmail: input.clientEmail || '',
          items: items,
          amount,
          status: amount > 0 ? 'envoyee' : 'brouillon',
          note: input.note,
          kind: input.kind || 'caisse',
          clientId,
          planId: input.planId,
        },
      });
      return this.toInvoice(row);
    });
  }

  async updateInvoice(
    id: string,
    patch: {
      items?: InvoiceLine[];
      status?: InvoiceStatus;
      note?: string;
      amount?: number;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.invoice.findUnique({ where: { id } });
      if (!current) return null;

      let items = (
        Array.isArray(current.items) ? current.items : []
      ) as InvoiceLine[];
      let amount = current.amount;

      if (patch.items) {
        items = patch.items;
        amount = invoiceTotal(items);
      }
      if (typeof patch.amount === 'number' && Number.isFinite(patch.amount)) {
        if (items.length === 0) {
          items = [{ name: 'Prestation', qty: 1, unitPrice: patch.amount }];
          amount = invoiceTotal(items);
        } else if (items.length === 1) {
          items = [{ ...items[0], unitPrice: patch.amount }];
          amount = invoiceTotal(items);
        } else {
          const rest = items
            .slice(1)
            .reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
          items = [
            { ...items[0], unitPrice: Math.max(0, patch.amount - rest) },
            ...items.slice(1),
          ];
          amount = invoiceTotal(items);
        }
      }

      const row = await tx.invoice.update({
        where: { id },
        data: {
          items: items,
          amount,
          ...(patch.status ? { status: patch.status } : {}),
          ...(patch.note !== undefined ? { note: patch.note } : {}),
        },
      });
      if (row.bookingId) {
        await tx.booking.update({
          where: { id: row.bookingId },
          data: { amount: row.amount },
        });
      }
      return this.toInvoice(row);
    });
  }

  async sendBookingQuote(
    bookingId: string,
    input: { items?: InvoiceLine[]; amount?: number },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { invoice: true },
      });
      if (!booking) throw new NotFoundException('Rendez-vous introuvable.');
      if (booking.status === 'annule') {
        throw new UnprocessableEntityException('Ce rendez-vous est annulé.');
      }
      if (booking.paymentStatus === 'paid') {
        throw new UnprocessableEntityException('Ce rendez-vous est déjà payé.');
      }
      let items = asInvoiceLines(input.items);
      if (!items.length) {
        const value = Math.round(Number(input.amount));
        if (!Number.isFinite(value) || value <= 0) {
          throw new UnprocessableEntityException('Indique un montant de devis.');
        }
        items = [{ name: booking.serviceName, qty: 1, unitPrice: value }];
      }
      const amount = invoiceTotal(items);
      if (amount <= 0) {
        throw new UnprocessableEntityException('Indique un montant de devis.');
      }
      const quoteNote = `${booking.dateLabel} · ${booking.time} · devis`;
      const invoice = booking.invoice
        ? await tx.invoice.update({
            where: { id: booking.invoice.id },
            data: { items, amount, status: 'envoyee', note: quoteNote },
          })
        : await tx.invoice.create({
            data: {
              number: await this.nextInvoiceNumber(tx),
              bookingId: booking.id,
              clientName: booking.name,
              clientPhone: booking.phone,
              clientEmail: booking.email,
              items,
              amount,
              status: 'envoyee',
              note: quoteNote,
              kind: 'rdv',
              clientId: booking.clientId || undefined,
            },
          });
      const row = await tx.booking.update({
        where: { id: booking.id },
        data: {
          amount,
          status: booking.status === 'termine' ? booking.status : 'nouveau',
          paymentMethod: null,
        },
        include: { invoice: true },
      });
      return { booking: this.toBooking(row), invoice: this.toInvoice(invoice) };
    });
  }

  async acceptQuoteAtSalon(bookingId: string, client: Client) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { invoice: true },
    });
    if (!booking) throw new NotFoundException('Rendez-vous introuvable.');
    const owned =
      booking.clientId === client.id ||
      (client.phone && booking.phone === client.phone);
    if (!owned) throw new NotFoundException('Rendez-vous introuvable.');
    if (booking.status === 'annule') {
      throw new UnprocessableEntityException('Ce rendez-vous est annulé.');
    }
    if (booking.paymentStatus === 'paid') {
      throw new UnprocessableEntityException('Ce rendez-vous est déjà payé.');
    }
    if (booking.amount <= 0) {
      throw new UnprocessableEntityException(
        'Le devis n’est pas encore disponible.',
      );
    }
    const row = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { paymentMethod: 'especes', status: 'confirme' },
      include: { invoice: true },
    });
    if (row.invoice) {
      await this.prisma.invoice.update({
        where: { id: row.invoice.id },
        data: { paymentMethod: 'especes' },
      });
    }
    return this.toBooking(row);
  }

  async cancelClientBooking(bookingId: string, client: Client) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { invoice: true },
    });
    if (!booking) throw new NotFoundException('Rendez-vous introuvable.');
    const owned =
      booking.clientId === client.id ||
      (client.phone && booking.phone === client.phone);
    if (!owned) throw new NotFoundException('Rendez-vous introuvable.');
    if (booking.status === 'annule') {
      throw new UnprocessableEntityException('Ce rendez-vous est déjà annulé.');
    }
    if (booking.status === 'termine') {
      throw new UnprocessableEntityException(
        'Ce rendez-vous est déjà terminé.',
      );
    }
    if (booking.paymentStatus === 'paid' && !this.isMembershipBooking(booking)) {
      throw new UnprocessableEntityException(
        'Un rendez-vous payé ne peut pas être annulé ici.',
      );
    }
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'annule' },
        include: { invoice: true },
      });
      if (this.isMembershipBooking(booking)) {
        await this.restoreMembershipVisit(tx, booking.clientId, booking.phone);
      }
      if (updated.invoice && updated.invoice.status !== 'payee') {
        await tx.invoice.update({
          where: { id: updated.invoice.id },
          data: { status: 'annulee' },
        });
      }
      return updated;
    });
    return this.toBooking(row);
  }

  async addExpense(input: {
    dateIso: string;
    category: ExpenseCategory;
    amount: number;
    note: string;
  }) {
    const row = await this.prisma.expense.create({
      data: {
        dateIso: input.dateIso,
        category: input.category,
        amount: input.amount,
        note: input.note,
      },
    });
    return this.toExpense(row);
  }

  async deleteExpense(id: string) {
    const removed = await this.prisma.expense.deleteMany({ where: { id } });
    return removed.count > 0;
  }

  async adjustClient(
    clientId: string,
    patch: { pointsDelta?: number; creditDelta?: number; note?: string },
  ) {
    const pointsDelta = Number(patch.pointsDelta) || 0;
    const creditDelta = Number(patch.creditDelta) || 0;
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.client.findUnique({ where: { id: clientId } });
      if (!current) return null;
      const row = await tx.client.update({
        where: { id: clientId },
        data: {
          points: Math.max(0, current.points + pointsDelta),
          creditFcfa: Math.max(0, current.creditFcfa + creditDelta),
        },
      });
      if (pointsDelta || creditDelta) {
        await tx.loyaltyEvent.create({
          data: {
            clientId: row.id,
            kind: 'adjust',
            points: pointsDelta,
            creditFcfa: creditDelta,
            label: patch.note?.trim() || 'Ajustement salon',
          },
        });
      }
      return this.publicClient(this.toClient(row));
    });
  }

  async salonSnapshot(): Promise<SalonSnapshot> {
    await this.refreshMemberships();
    const [
      bookings,
      invoices,
      payments,
      expenses,
      applications,
      clients,
      memberships,
    ] = await Promise.all([
      this.prisma.booking.findMany({
        orderBy: [{ dateIso: 'asc' }, { time: 'asc' }, { createdAt: 'asc' }],
        include: { invoice: true },
      }),
      this.prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.payment.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.expense.findMany({
        orderBy: [{ dateIso: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.application.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.client.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.membership.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    return {
      bookings: bookings.map((row) => this.toBooking(row)),
      invoices: invoices.map((row) => this.toInvoice(row)),
      payments: payments.map((row) => this.toPayment(row)),
      expenses: expenses.map((row) => this.toExpense(row)),
      applications: applications.map((row) => this.toApplication(row)),
      clients: clients.map((row) => this.publicClient(this.toClient(row))),
      memberships: memberships.map((row) => this.toMembership(row)),
    };
  }

  async createApplication(input: {
    jobId: string;
    jobTitle: string;
    name: string;
    phone: string;
    email: string;
    letter: string;
    cv: UploadedDocument;
    letterFile?: UploadedDocument;
  }) {
    const id = randomUUID();
    configureCloudinary(this.config);
    const folder = careerFolder(this.config);
    const cvPath = await uploadCareerFile(
      input.cv.bytes,
      input.cv.name,
      input.cv.type,
      folder,
    );

    let letterPath: string | undefined;
    let letterName: string | undefined;
    if (input.letterFile) {
      letterName = input.letterFile.name;
      letterPath = await uploadCareerFile(
        input.letterFile.bytes,
        input.letterFile.name,
        input.letterFile.type,
        folder,
      );
    }

    const row = await this.prisma.application.create({
      data: {
        id,
        jobId: input.jobId,
        jobTitle: input.jobTitle,
        name: input.name,
        phone: input.phone,
        email: input.email,
        letter: input.letter,
        cvName: input.cv.name || cvPath,
        cvPath,
        letterName,
        letterPath,
      },
    });
    return this.toApplication(row);
  }

  async getApplication(id: string) {
    const row = await this.prisma.application.findUnique({ where: { id } });
    return row ? this.toApplication(row) : null;
  }

  async updateApplicationStatus(id: string, status: ApplicationStatus) {
    const current = await this.prisma.application.findUnique({ where: { id } });
    if (!current) return null;
    const row = await this.prisma.application.update({
      where: { id },
      data: { status },
    });
    return this.toApplication(row);
  }

  async readApplicationFile(application: Application, kind: 'cv' | 'lettre') {
    const stored =
      kind === 'lettre' ? application.letterPath : application.cvPath;
    if (!stored) return null;
    const filename =
      (kind === 'lettre' ? application.letterName : application.cvName) ||
      basename(stored);
    if (/^https?:\/\//i.test(stored)) {
      return { url: stored, filename };
    }
    const safe = basename(stored);
    const bytes = await readFile(join(applicationsDir(), safe));
    return { bytes, filename };
  }

  private async findInvoiceRow(
    tx: Prisma.TransactionClient,
    opts: { invoiceId?: string; paydunyaToken?: string },
  ) {
    if (opts.invoiceId) {
      const byId = await tx.invoice.findUnique({
        where: { id: opts.invoiceId },
      });
      if (byId) return byId;
    }
    if (opts.paydunyaToken) {
      return tx.invoice.findFirst({
        where: { paydunyaToken: opts.paydunyaToken },
      });
    }
    return null;
  }

  private async resolveClient(
    tx: Prisma.TransactionClient,
    clientId?: string | null,
    phone?: string | null,
  ) {
    if (clientId) {
      const byId = await tx.client.findUnique({ where: { id: clientId } });
      if (byId) return byId;
    }
    const normalized = phone ? normalizePhone(phone) : '';
    if (!normalized || normalized === '+' || normalized.startsWith(PENDING_PHONE_PREFIX)) {
      return null;
    }
    return tx.client.findUnique({ where: { phone: normalized } });
  }

  async ensurePublicClient(input: {
    clientId?: string;
    name: string;
    phone: string;
    email?: string;
  }) {
    return this.prisma.$transaction((tx) => this.ensureClient(tx, input));
  }

  async activateClientSession(client: { id: string; phone: string }) {
    const phone = client.phone || '';
    if (!phone || phone.startsWith(PENDING_PHONE_PREFIX)) return;
    await this.linkClientHistory(client.id, phone);
    await this.prisma.booking.updateMany({
      where: {
        status: 'nouveau',
        OR: [{ clientId: client.id }, { phone }],
      },
      data: { status: 'confirme' },
    });
  }

  private async ensureClient(
    tx: Prisma.TransactionClient,
    input: { clientId?: string; name: string; phone: string; email?: string },
  ): Promise<{ id: string; generatedPassword?: string }> {
    const existing = await this.resolveClient(tx, input.clientId, input.phone);
    if (existing) {
      if (input.email && !existing.email) {
        await tx.client.update({
          where: { id: existing.id },
          data: { email: input.email },
        });
      }
      return { id: existing.id };
    }
    const phone = normalizePhone(input.phone);
    if (!phone || phone === '+' || phone.startsWith(PENDING_PHONE_PREFIX)) {
      return { id: '' };
    }
    const generatedPassword = generatePassword();
    try {
      const row = await tx.client.create({
        data: {
          name: input.name.trim() || 'Client MAC NATION',
          phone,
          email: (input.email || '').trim(),
          passwordHash: hashPassword(generatedPassword),
        },
      });
      await this.attachClientHistory(tx, row.id, phone);
      return { id: row.id, generatedPassword };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const again = await this.resolveClient(tx, undefined, phone);
        if (again) return { id: again.id };
      }
      throw error;
    }
  }

  private async awardPaidInvoice(
    tx: Prisma.TransactionClient,
    invoice: InvoiceRow,
  ): Promise<Membership | null> {
    const client = await this.resolveClient(
      tx,
      invoice.clientId,
      invoice.clientPhone,
    );
    if (!client) return null;
    if (!invoice.clientId) {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { clientId: client.id },
      });
    }

    const earned = await tx.loyaltyEvent.findFirst({
      where: { invoiceId: invoice.id, kind: 'earn' },
    });
    if (!earned) {
      const points = pointsForAmount(invoice.amount);
      if (points > 0) {
        await tx.client.update({
          where: { id: client.id },
          data: { points: { increment: points } },
        });
        await tx.loyaltyEvent.create({
          data: {
            clientId: client.id,
            kind: 'earn',
            points,
            creditFcfa: 0,
            label: `Achat ${invoice.number}`,
            invoiceId: invoice.id,
          },
        });
      }
    }

    if (invoice.kind !== 'abonnement') return null;
    const existing = await tx.membership.findFirst({
      where: { invoiceId: invoice.id },
    });
    if (existing) return this.toMembership(existing);
    return this.activateMembership(
      tx,
      client.id,
      invoice.planId || this.planIdFromInvoice(invoice),
      invoice.id,
    );
  }

  private planIdFromInvoice(invoice: InvoiceRow) {
    const items = (
      Array.isArray(invoice.items) ? invoice.items : []
    ) as InvoiceLine[];
    const name = (items[0]?.name || '').toLowerCase();
    if (name.includes('nation')) return 'nation';
    if (name.includes('essentiel')) return 'essentiel';
    return 'signature';
  }

  async currentMembershipFor(clientId: string) {
    await this.refreshMemberships(clientId);
    const membership = await this.prisma.membership.findFirst({
      where: { clientId, status: 'actif' },
      orderBy: { expiresAt: 'desc' },
    });
    return membership ? this.toMembership(membership) : null;
  }

  async activeMembershipFor(clientId: string) {
    const membership = await this.currentMembershipFor(clientId);
    if (!membership || membership.visitsUsed >= membership.visitsTotal) {
      return null;
    }
    return membership;
  }

  private isMembershipBooking(booking: {
    paymentStatus: string;
    paymentMethod?: string | null;
    amount: number;
  }) {
    return (
      booking.paymentStatus === 'paid' &&
      booking.paymentMethod === 'autre' &&
      booking.amount <= 0
    );
  }

  private async restoreMembershipVisit(
    tx: Prisma.TransactionClient,
    clientId?: string | null,
    phone?: string,
  ) {
    const client = await this.resolveClient(tx, clientId, phone || '');
    if (!client) return;
    const membership = await tx.membership.findFirst({
      where: { clientId: client.id, visitsUsed: { gt: 0 } },
      orderBy: { startedAt: 'desc' },
    });
    if (!membership) return;
    await tx.membership.update({
      where: { id: membership.id },
      data: { visitsUsed: { decrement: 1 } },
    });
  }

  async consumeVisitForClient(clientId: string) {
    return this.prisma.$transaction((tx) =>
      this.takeMembershipVisit(tx, clientId),
    );
  }

  private async takeMembershipVisit(
    tx: Prisma.TransactionClient,
    clientId: string,
  ) {
    await tx.membership.updateMany({
      where: {
        clientId,
        status: 'actif',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expire' },
    });
    const membership = await tx.membership.findFirst({
      where: { clientId, status: 'actif' },
      orderBy: { expiresAt: 'desc' },
    });
    if (!membership || membership.visitsUsed >= membership.visitsTotal) {
      throw new UnprocessableEntityException(
        'Plus de visites sur ton abonnement.',
      );
    }
    const consumed = await tx.membership.updateMany({
      where: {
        id: membership.id,
        status: 'actif',
        visitsUsed: { lt: membership.visitsTotal },
      },
      data: { visitsUsed: { increment: 1 } },
    });
    if (consumed.count === 0) {
      throw new UnprocessableEntityException(
        'Plus de visites sur ton abonnement.',
      );
    }
    const row = await tx.membership.findUnique({
      where: { id: membership.id },
    });
    if (!row) {
      throw new UnprocessableEntityException(
        'Plus de visites sur ton abonnement.',
      );
    }
    return this.toMembership(row);
  }

  private async consumeMembershipVisit(
    tx: Prisma.TransactionClient,
    booking: BookingRow,
  ) {
    const client = await this.resolveClient(
      tx,
      booking.clientId,
      booking.phone,
    );
    if (!client) return;
    if (!booking.clientId) {
      await tx.booking.update({
        where: { id: booking.id },
        data: { clientId: client.id },
      });
    }
    await tx.membership.updateMany({
      where: {
        clientId: client.id,
        status: 'actif',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expire' },
    });
    const membership = await tx.membership.findFirst({
      where: { clientId: client.id, status: 'actif' },
      orderBy: { expiresAt: 'desc' },
    });
    if (!membership || membership.visitsUsed >= membership.visitsTotal) return;
    await tx.membership.update({
      where: { id: membership.id },
      data: { visitsUsed: { increment: 1 } },
    });
  }

  private async attachClientHistory(
    tx: Prisma.TransactionClient,
    clientId: string,
    phone: string,
  ) {
    if (!isSnMobile(phone)) return;
    const normalized = normalizePhone(phone);
    await tx.booking.updateMany({
      where: { clientId: null, phone: normalized },
      data: { clientId },
    });
    await tx.invoice.updateMany({
      where: { clientId: null, clientPhone: normalized },
      data: { clientId },
    });
  }

  private async linkClientHistory(clientId: string, phone: string) {
    if (!phone || phone.startsWith(PENDING_PHONE_PREFIX)) return;
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.attachClientHistory(tx, clientId, phone);
      });
    } catch (error) {
      this.logger.warn(
        `Rattachement historique client échoué: ${String(error)}`,
      );
    }
  }

  private async activateMembership(
    tx: Prisma.TransactionClient,
    clientId: string,
    planId: string,
    invoiceId?: string,
  ) {
    const plan = await tx.plan.findFirst({
      where: { OR: [{ slug: planId }, { id: planId }] },
    });
    const perks = plan
      ? {
          visits: plan.visits,
          boutiquePercent: plan.boutiquePercent,
          name: plan.name,
        }
      : planPerks(planId);
    const storedPlanId = plan?.slug || planId;
    await tx.membership.updateMany({
      where: { clientId, status: 'actif' },
      data: { status: 'annule' },
    });
    const startedAt = new Date();
    const expiresAt = new Date(addDays(startedAt.toISOString(), 30));
    const row = await tx.membership.create({
      data: {
        clientId,
        planId: storedPlanId,
        planName: perks.name,
        startedAt,
        expiresAt,
        visitsTotal: perks.visits,
        boutiquePercent: perks.boutiquePercent,
        invoiceId,
      },
    });
    return this.toMembership(row);
  }

  private async refreshMemberships(clientId?: string) {
    await this.prisma.membership.updateMany({
      where: {
        status: 'actif',
        expiresAt: { lt: new Date() },
        ...(clientId ? { clientId } : {}),
      },
      data: { status: 'expire' },
    });
  }

  private async nextInvoiceNumber(tx: Prisma.TransactionClient) {
    const counter = await tx.invoiceCounter.upsert({
      where: { id: 'default' },
      create: { id: 'default', value: 1 },
      update: { value: { increment: 1 } },
    });
    return `MN-${String(counter.value).padStart(4, '0')}`;
  }

  private toClient(row: ClientRow): Client {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      name: row.name,
      phone: row.phone,
      email: row.email,
      passwordHash: row.passwordHash,
      points: row.points,
      creditFcfa: row.creditFcfa,
      googleId: row.googleId ?? undefined,
      appleId: row.appleId ?? undefined,
      facebookId: row.facebookId ?? undefined,
    };
  }

  private async findPendingRow(opts: {
    pendingId?: string;
    paytechRef?: string;
    token?: string;
  }) {
    if (opts.pendingId) {
      const byId = await this.prisma.pendingPayment.findUnique({
        where: { id: opts.pendingId },
      });
      if (byId) return byId;
    }
    if (opts.paytechRef) {
      const byRef = await this.prisma.pendingPayment.findUnique({
        where: { paytechRef: opts.paytechRef },
      });
      if (byRef) return byRef;
    }
    if (opts.token) {
      return this.prisma.pendingPayment.findFirst({
        where: { paytechToken: opts.token },
      });
    }
    return null;
  }

  private expireIfNeeded<T extends { status: string; expiresAt: Date }>(row: T) {
    if (
      row.status === 'pending' &&
      row.expiresAt.getTime() <= Date.now()
    ) {
      return { ...row, status: 'expired' as const };
    }
    return row;
  }

  private parsePendingPayload(raw: unknown): PendingPayload {
    const row = (raw && typeof raw === 'object' ? raw : {}) as Record<
      string,
      unknown
    >;
    const kind = row.kind;
    const items = asInvoiceLines(row.items);
    if (kind === 'booking') {
      return {
        kind: 'booking',
        name: String(row.name || ''),
        phone: String(row.phone || ''),
        email: String(row.email || ''),
        serviceId: String(row.serviceId || ''),
        serviceName: String(row.serviceName || ''),
        dateIso: String(row.dateIso || ''),
        dateLabel: String(row.dateLabel || ''),
        time: String(row.time || ''),
        durationMin: durationMinutes(
      typeof row.durationMin === 'number' || typeof row.durationMin === 'string'
        ? row.durationMin
        : DEFAULT_DURATION_MIN,
    ),
        place: row.place === 'domicile' ? 'domicile' : 'salon',
        address: String(row.address || ''),
        amount: Number(row.amount) || 0,
        items,
        note: String(row.note || ''),
        clientId: typeof row.clientId === 'string' ? row.clientId : undefined,
        confirmed: row.confirmed === true,
        bookingId: typeof row.bookingId === 'string' ? row.bookingId : undefined,
        invoiceId: typeof row.invoiceId === 'string' ? row.invoiceId : undefined,
      };
    }
    return {
      kind: kind === 'abonnement' ? 'abonnement' : 'boutique',
      clientName: String(row.clientName || ''),
      clientPhone: String(row.clientPhone || ''),
      clientEmail: String(row.clientEmail || ''),
      items,
      note: String(row.note || ''),
      label: String(row.label || ''),
      clientId: typeof row.clientId === 'string' ? row.clientId : undefined,
      planId: typeof row.planId === 'string' ? row.planId : undefined,
    };
  }

  private toPending(row: {
    id: string;
    kind: string;
    amount: number;
    status: string;
    invoiceId?: string | null;
    payload: unknown;
    paytechRef: string;
    paytechToken?: string | null;
    expiresAt: Date;
  }): PendingPayment {
    const payload = this.parsePendingPayload(row.payload);
    return {
      id: row.id,
      kind: payload.kind,
      amount: row.amount,
      status:
        row.status === 'paid'
          ? 'paid'
          : row.status === 'expired'
            ? 'expired'
            : 'pending',
      invoiceId: row.invoiceId || undefined,
      payload,
      paytechRef: row.paytechRef,
      paytechToken: row.paytechToken || undefined,
      expiresAt: row.expiresAt.toISOString(),
    };
  }

  private toBooking(row: BookingWithInvoice): Booking {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      name: row.name,
      phone: row.phone,
      email: row.email,
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      dateIso: row.dateIso,
      dateLabel: row.dateLabel,
      time: row.time,
      durationMin: row.durationMin,
      place: row.place,
      address: row.address,
      status: row.status,
      amount: row.amount,
      paymentStatus: row.paymentStatus,
      paymentMethod: row.paymentMethod ?? undefined,
      invoiceId: row.invoice?.id,
      clientId: row.clientId ?? undefined,
      quoted:
        row.amount <= 0 ||
        /devis/i.test(row.invoice?.note || ''),
    };
  }

  private toInvoice(row: InvoiceRow): Invoice {
    const items = asInvoiceLines(row.items);
    return {
      id: row.id,
      number: row.number,
      createdAt: row.createdAt.toISOString(),
      paidAt: row.paidAt?.toISOString(),
      bookingId: row.bookingId ?? undefined,
      clientName: row.clientName,
      clientPhone: row.clientPhone,
      clientEmail: row.clientEmail,
      items,
      amount: items.length ? invoiceTotal(items) : row.amount,
      status: row.status,
      paymentMethod: row.paymentMethod ?? undefined,
      paydunyaToken: row.paydunyaToken ?? undefined,
      paydunyaUrl: row.paydunyaUrl ?? undefined,
      note: row.note ?? undefined,
      kind: row.kind ?? undefined,
      clientId: row.clientId ?? undefined,
      planId: row.planId ?? undefined,
    };
  }

  private toPayment(row: PaymentRow): Payment {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      invoiceId: row.invoiceId ?? undefined,
      bookingId: row.bookingId ?? undefined,
      amount: row.amount,
      method: row.method,
      status: row.status,
      note: row.note ?? undefined,
      paydunyaToken: row.paydunyaToken ?? undefined,
    };
  }

  private toExpense(row: ExpenseRow): Expense {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      dateIso: row.dateIso,
      category: row.category,
      amount: row.amount,
      note: row.note,
    };
  }

  private toApplication(row: ApplicationRow): Application {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      jobId: row.jobId,
      jobTitle: row.jobTitle,
      name: row.name,
      phone: row.phone,
      email: row.email,
      letter: row.letter,
      cvName: row.cvName,
      cvPath: row.cvPath,
      letterName: row.letterName ?? undefined,
      letterPath: row.letterPath ?? undefined,
      status: row.status,
    };
  }

  private toMembership(row: MembershipRow): Membership {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      clientId: row.clientId,
      planId: row.planId,
      planName: row.planName,
      startedAt: row.startedAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      visitsTotal: row.visitsTotal,
      visitsUsed: row.visitsUsed,
      boutiquePercent: row.boutiquePercent,
      status: row.status,
      invoiceId: row.invoiceId ?? undefined,
    };
  }

  private toLoyalty(row: LoyaltyRow): LoyaltyEvent {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      clientId: row.clientId,
      kind: row.kind,
      points: row.points,
      creditFcfa: row.creditFcfa,
      label: row.label,
      invoiceId: row.invoiceId ?? undefined,
    };
  }
}
