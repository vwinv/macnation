import { readFileSync } from 'fs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { normalizePhone } from '../common/phone';
import { PrismaService } from '../prisma/prisma.service';

const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

export type PushPayload = {
  title: string;
  body: string;
  kind: string;
  audience?: string;
  clientIds?: string[];
  articleId?: string;
  bookingId?: string;
  data?: Record<string, string>;
};

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private messaging: Messaging | null | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  configured() {
    return Boolean(this.fcm());
  }

  async deviceCount() {
    return this.prisma.deviceToken.count();
  }

  async listCampaigns() {
    return this.prisma.pushCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 40,
    });
  }

  async registerToken(input: {
    token: string;
    platform?: string;
    clientId?: string;
  }) {
    const token = input.token.trim();
    if (token.length < 20) return { ok: false };
    const platform = ['ios', 'android', 'web'].includes(input.platform || '')
      ? (input.platform as string)
      : 'android';
    await this.prisma.deviceToken.upsert({
      where: { token },
      create: {
        token,
        platform,
        clientId: input.clientId || null,
      },
      update: {
        platform,
        ...(input.clientId ? { clientId: input.clientId } : {}),
      },
    });
    return { ok: true };
  }

  async unregisterToken(token: string) {
    const value = token.trim();
    if (!value) return { ok: true };
    await this.prisma.deviceToken.deleteMany({ where: { token: value } });
    return { ok: true };
  }

  async sendToAll(payload: PushPayload) {
    const tokens = await this.prisma.deviceToken.findMany({
      select: { token: true },
    });
    return this.dispatch(
      tokens.map((row) => row.token),
      payload,
      'general',
    );
  }

  async sendToClients(clientIds: string[], payload: PushPayload) {
    const ids = [...new Set(clientIds.filter(Boolean))];
    if (!ids.length) {
      return this.record(payload, 'targeted', 0, 0, ids);
    }
    const tokens = await this.prisma.deviceToken.findMany({
      where: { clientId: { in: ids } },
      select: { token: true },
    });
    return this.dispatch(
      tokens.map((row) => row.token),
      payload,
      'targeted',
      ids,
    );
  }

  async articlePublished(article: { id: string; title: string; excerpt?: string }) {
    const result = await this.sendToAll({
      title: 'Nouveau sur le journal',
      body: article.title,
      kind: 'article',
      articleId: article.id,
      data: { articleId: article.id },
    });
    await this.prisma.article.update({
      where: { id: article.id },
      data: { pushNotifiedAt: new Date() },
    });
    return result;
  }

  async bookingReminder(input: {
    bookingId: string;
    clientId?: string | null;
    phone: string;
    serviceName: string;
    dateLabel: string;
    time: string;
    when: 'eve' | 'day';
  }) {
    const title =
      input.when === 'eve' ? 'RDV demain' : 'RDV aujourd’hui';
    const body =
      input.when === 'eve'
        ? `${input.serviceName} demain à ${input.time}. ${input.dateLabel}.`
        : `C’est le jour J : ${input.serviceName} à ${input.time}. On t’attend.`;
    const clientIds = await this.clientIdsForBooking(input.clientId, input.phone);
    return this.sendToClients(clientIds, {
      title,
      body,
      kind: input.when === 'eve' ? 'booking_eve' : 'booking_day',
      bookingId: input.bookingId,
      data: { bookingId: input.bookingId },
    });
  }

  async sendRemindersForDate(todayIso: string, tomorrowIso: string) {
    if (!this.configured()) {
      return { sent: 0, eve: 0, day: 0 };
    }
    const [todayRows, tomorrowRows] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          dateIso: todayIso,
          reminderDaySent: false,
          status: { in: ['nouveau', 'confirme'] },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          dateIso: tomorrowIso,
          reminderEveSent: false,
          status: { in: ['nouveau', 'confirme'] },
        },
      }),
    ]);
    let sent = 0;
    for (const row of tomorrowRows) {
      await this.bookingReminder({
        bookingId: row.id,
        clientId: row.clientId,
        phone: row.phone,
        serviceName: row.serviceName,
        dateLabel: row.dateLabel,
        time: row.time,
        when: 'eve',
      });
      await this.prisma.booking.update({
        where: { id: row.id },
        data: { reminderEveSent: true },
      });
      sent += 1;
    }
    for (const row of todayRows) {
      await this.bookingReminder({
        bookingId: row.id,
        clientId: row.clientId,
        phone: row.phone,
        serviceName: row.serviceName,
        dateLabel: row.dateLabel,
        time: row.time,
        when: 'day',
      });
      await this.prisma.booking.update({
        where: { id: row.id },
        data: { reminderDaySent: true },
      });
      sent += 1;
    }
    return { sent, eve: tomorrowRows.length, day: todayRows.length };
  }

  private async clientIdsForBooking(clientId: string | null | undefined, phone: string) {
    const ids = new Set<string>();
    if (clientId) ids.add(clientId);
    if (phone) {
      const client = await this.prisma.client.findUnique({
        where: { phone: normalizePhone(phone) },
        select: { id: true },
      });
      if (client) ids.add(client.id);
    }
    return [...ids];
  }

  private async dispatch(
    tokens: string[],
    payload: PushPayload,
    audience: string,
    clientIds: string[] = payload.clientIds || [],
  ) {
    const unique = [...new Set(tokens.filter(Boolean))];
    const fcm = this.fcm();
    if (!fcm || unique.length === 0) {
      return this.record(payload, audience, 0, 0, clientIds);
    }
    let sentCount = 0;
    let failCount = 0;
    const dead: string[] = [];
    for (let i = 0; i < unique.length; i += 500) {
      const batch = unique.slice(i, i + 500);
      try {
        const result = await fcm.sendEachForMulticast({
          tokens: batch,
          notification: { title: payload.title, body: payload.body },
          data: {
            kind: payload.kind,
            ...(payload.articleId ? { articleId: payload.articleId } : {}),
            ...(payload.bookingId ? { bookingId: payload.bookingId } : {}),
            ...(payload.data || {}),
          },
          android: { priority: 'high' },
          apns: { payload: { aps: { sound: 'default' } } },
        });
        result.responses.forEach((item, index) => {
          if (item.success) {
            sentCount += 1;
            return;
          }
          failCount += 1;
          const code = item.error?.code || '';
          if (DEAD_TOKEN_CODES.has(code)) dead.push(batch[index]);
        });
      } catch (error) {
        this.logger.warn(`FCM lot échoué: ${String(error)}`);
        failCount += batch.length;
      }
    }
    if (dead.length) {
      await this.prisma.deviceToken.deleteMany({ where: { token: { in: dead } } });
    }
    return this.record(payload, audience, sentCount, failCount, clientIds);
  }

  private async record(
    payload: PushPayload,
    audience: string,
    sentCount: number,
    failCount: number,
    clientIds: string[],
  ) {
    const campaign = await this.prisma.pushCampaign.create({
      data: {
        title: payload.title,
        body: payload.body,
        kind: payload.kind,
        audience,
        clientIds,
        articleId: payload.articleId || null,
        bookingId: payload.bookingId || null,
        sentCount,
        failCount,
      },
    });
    this.logger.log(
      `Push ${payload.kind} · ${audience} · envoyés ${sentCount} · échecs ${failCount}`,
    );
    return campaign;
  }

  private fcm() {
    if (this.messaging !== undefined) return this.messaging;
    const raw = (
      this.config.get<string>('FIREBASE_SERVICE_ACCOUNT') ||
      this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS') ||
      ''
    ).trim();
    if (!raw) {
      this.logger.debug('Push ignoré : FIREBASE_SERVICE_ACCOUNT absent.');
      this.messaging = null;
      return this.messaging;
    }
    try {
      const parsed: ServiceAccount = raw.startsWith('{')
        ? (JSON.parse(raw) as ServiceAccount)
        : (JSON.parse(readFileSync(raw, 'utf8')) as ServiceAccount);
      if (!getApps().length) {
        initializeApp({ credential: cert(parsed) });
      }
      this.messaging = getMessaging();
      return this.messaging;
    } catch (error) {
      this.logger.warn(`Firebase Admin illisible: ${String(error)}`);
      this.messaging = null;
      return this.messaging;
    }
  }
}
