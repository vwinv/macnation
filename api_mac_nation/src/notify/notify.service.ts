import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { normalizePhone } from '../common/phone';
import { siteUrl } from '../common/site';

const DEFAULT_WHATSAPP_TEMPLATE = 'HX1aba3b44ba175f8983ab7b44db19dbaf';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function emailHtml(title: string, lines: string[]) {
  const rows = lines
    .map(
      (line) =>
        `<p style="margin:0 0 8px;font-size:16px;line-height:1.5;color:#f4f4f5">${escapeHtml(line)}</p>`,
    )
    .join('');
  return `<!doctype html>
<html>
  <body style="margin:0;background:#070708;padding:32px;font-family:Georgia,serif">
    <div style="max-width:480px;margin:0 auto;background:#111113;border:1px solid #c4a57455;padding:28px">
      <p style="margin:0 0 18px;font-size:13px;letter-spacing:0.18em;color:#c4a574">MAC NATION</p>
      <h1 style="margin:0 0 20px;font-size:28px;line-height:1.1;color:#fff">${escapeHtml(title)}</h1>
      ${rows}
    </div>
  </body>
</html>`;
}

/**
 * Every method resolves to a boolean and never throws: a missing mail/SMS
 * key must not turn a successful booking into a failed request.
 */
@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);
  private smtp: Transporter | null | undefined;

  constructor(private readonly config: ConfigService) {}

  private env(key: string) {
    return (this.config.get<string>(key) || '').trim();
  }

  ownerPhone() {
    return this.env('BOOKING_SMS_TO');
  }

  smsConfigured() {
    return Boolean(
      this.env('TWILIO_ACCOUNT_SID') &&
      this.env('TWILIO_AUTH_TOKEN') &&
      this.env('TWILIO_FROM'),
    );
  }

  async sendSms(to: string, body: string) {
    const sid = this.env('TWILIO_ACCOUNT_SID');
    const token = this.env('TWILIO_AUTH_TOKEN');
    const from = this.env('TWILIO_FROM');
    const target = normalizePhone(to || '');
    if (!sid || !token || !from || !target || target === '+') {
      this.logger.debug('SMS ignoré : configuration Twilio incomplète.');
      return false;
    }
    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: target, From: from, Body: body }),
        },
      );
      if (!res.ok) {
        this.logger.warn(`Twilio SMS ${res.status}: ${await res.text()}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.warn(`Twilio SMS injoignable: ${String(error)}`);
      return false;
    }
  }

  async sendWhatsApp(to: string, dateSlot: string, timeSlot: string) {
    const sid = this.env('TWILIO_ACCOUNT_SID');
    const token = this.env('TWILIO_AUTH_TOKEN');
    const from = this.env('WHATSAPP_FROM');
    const contentSid =
      this.env('WHATSAPP_CONTENT_SID') || DEFAULT_WHATSAPP_TEMPLATE;
    const target = normalizePhone(to || '');
    if (!sid || !token || !from || !target || target === '+') return false;
    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: `whatsapp:${target}`,
            From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
            ContentSid: contentSid,
            ContentVariables: JSON.stringify({ '1': dateSlot, '2': timeSlot }),
          }),
        },
      );
      if (!res.ok) {
        this.logger.warn(`WhatsApp ${res.status}: ${await res.text()}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.warn(`WhatsApp injoignable: ${String(error)}`);
      return false;
    }
  }

  async sendEmail(options: {
    subject: string;
    title: string;
    lines: string[];
    clientEmail?: string;
  }) {
    const client = (options.clientEmail || '').trim();
    if (!client) {
      this.logger.debug('Mail ignoré : pas d’e-mail client.');
      return false;
    }
    const text = [options.title, ...options.lines].join('\n');
    const html = emailHtml(options.title, options.lines);
    return this.sendWithSmtp([client], options.subject, text, html);
  }

  private async sendClientEmail(options: {
    to: string;
    subject: string;
    title: string;
    lines: string[];
  }) {
    const text = [options.title, ...options.lines].join('\n');
    const html = emailHtml(options.title, options.lines);
    return this.sendWithSmtp([options.to], options.subject, text, html);
  }

  private mailFrom() {
    const address = this.env('MAIL_USER');
    const name = this.env('MAIL_FROM_NAME') || 'MAC NATION';
    if (!address) return '';
    return name ? `"${name}" <${address}>` : address;
  }

  private smtpTransport() {
    if (this.smtp !== undefined) return this.smtp;
    const host = this.env('MAIL_HOST');
    const user = this.env('MAIL_USER');
    const pass = this.env('MAIL_PASSWORD').replace(/^["']|["']$/g, '');
    if (!host || !user || !pass) {
      this.smtp = null;
      return this.smtp;
    }
    const port = Number(this.env('MAIL_PORT') || 587);
    this.smtp = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      requireTLS: port !== 465,
    });
    return this.smtp;
  }

  private async sendWithSmtp(
    to: string[],
    subject: string,
    text: string,
    html: string,
  ) {
    const transport = this.smtpTransport();
    const from = this.mailFrom();
    const recipients = [...new Set(to.filter(Boolean))];
    if (!transport || !from || recipients.length === 0) return false;
    try {
      const info = await transport.sendMail({
        from,
        to: recipients,
        subject,
        text,
        html,
      });
      this.logger.log(`SMTP envoyé → ${recipients.join(', ')} (${info.messageId})`);
      return true;
    } catch (error) {
      this.logger.warn(`SMTP échoué: ${String(error)}`);
      return false;
    }
  }

  async quoteReady(input: {
    name: string;
    phone: string;
    email: string;
    serviceName: string;
    dateLabel: string;
    time: string;
    amountLabel: string;
  }) {
    const accountUrl = `${siteUrl(this.config)}/compte`;
    const lines = [
      `${input.name}, le devis pour ${input.serviceName} est prêt.`,
      `${input.dateLabel} à ${input.time}`,
      `Montant : ${input.amountLabel}`,
      `Confirme et paie en ligne ou au salon depuis ton compte.`,
      accountUrl,
    ];
    await Promise.allSettled([
      this.sendEmail({
        subject: 'MAC NATION : ton devis est prêt',
        title: 'Ton devis est prêt',
        lines,
        clientEmail: input.email || undefined,
      }),
      this.sendSms(input.phone, ['MAC NATION : devis', ...lines].join('\n')),
    ]);
  }

  async quoteSalonChosen(input: {
    name: string;
    phone: string;
    email: string;
    serviceName: string;
    dateLabel: string;
    time: string;
    amountLabel: string;
  }) {
    const lines = [
      `${input.name}, tu as choisi de payer au salon.`,
      `${input.serviceName} · ${input.dateLabel} à ${input.time}`,
      `Montant : ${input.amountLabel}`,
      'Présente-toi à Nord Foire. Le salon encaissera sur place.',
    ];
    await Promise.allSettled([
      this.sendEmail({
        subject: 'MAC NATION : paiement au salon',
        title: 'Paiement au salon confirmé',
        lines,
        clientEmail: input.email || undefined,
      }),
      this.sendSms(input.phone, ['MAC NATION : paiement au salon', ...lines].join('\n')),
    ]);
  }

  async bookingCreated(input: {
    name: string;
    phone: string;
    email: string;
    serviceName: string;
    dateLabel: string;
    time: string;
    place: 'salon' | 'domicile';
    address: string;
    quoted?: boolean;
  }) {
    const owner = this.ownerPhone();
    const when = `${input.dateLabel} à ${input.time}`;
    const lieu =
      input.place === 'domicile'
        ? `Domicile: ${input.address}`
        : 'Salon Nord Foire';
    const ownerLines = [
      `${input.name} · ${input.phone}`,
      input.email,
      when,
      input.serviceName,
      lieu,
    ].filter(Boolean);
    const clientLines = [input.name, when, input.serviceName, lieu];

    await Promise.allSettled([
      owner
        ? this.sendSms(
            owner,
            ['MAC NATION : nouveau RDV', ...ownerLines].join('\n'),
          )
        : Promise.resolve(false),
      this.sendSms(
        input.phone,
        ['MAC NATION : votre RDV', ...clientLines].join('\n'),
      ),
      owner
        ? this.sendWhatsApp(
            owner,
            input.dateLabel,
            `${input.time} · ${input.name} · ${input.serviceName}`,
          )
        : Promise.resolve(false),
      this.sendWhatsApp(
        input.phone,
        input.dateLabel,
        `${input.time} · ${input.serviceName} · ${lieu}`,
      ),
      this.sendEmail({
        subject: input.quoted
          ? 'MAC NATION : demande de devis enregistrée'
          : 'MAC NATION : votre rendez-vous',
        title: input.quoted
          ? 'Ta demande de devis est enregistrée'
          : 'Votre rendez-vous est enregistré',
        lines: input.quoted
          ? [
              ...clientLines,
              'Le salon prépare le devis. Tu le recevras par mail, puis tu pourras confirmer et payer en ligne ou au salon.',
            ]
          : clientLines,
        clientEmail: input.email || undefined,
      }),
    ]);
  }

  async accountCreated(input: {
    name: string;
    phone: string;
    email?: string;
    password: string;
  }) {
    const loginUrl = `${siteUrl(this.config)}/compte/login`;
    const lines = [
      `${input.name}, ton compte MAC NATION est créé.`,
      `Connecte-toi pour confirmer ton rendez-vous, tes commandes et tes abonnements.`,
      `Téléphone : ${input.phone}`,
      `Mot de passe : ${input.password}`,
      `Mon compte : ${loginUrl}`,
    ];
    await Promise.allSettled([
      this.sendSms(
        input.phone,
        ['MAC NATION : ton compte', ...lines].join('\n'),
      ),
      input.email
        ? this.sendClientEmail({
            to: input.email,
            subject: 'MAC NATION : ton compte client',
            title: 'Ton compte est créé',
            lines,
          })
        : Promise.resolve(false),
    ]);
  }

  async checkoutCreated(input: {
    name: string;
    phone: string;
    email: string;
    label: string;
    amountLabel: string;
    note: string;
    kind: 'boutique' | 'abonnement';
  }) {
    const owner = this.ownerPhone();
    const lines = [
      input.name,
      input.phone,
      input.email,
      input.label,
      input.amountLabel,
      input.note,
    ].filter(Boolean);
    await Promise.allSettled([
      owner
        ? this.sendSms(owner, ['MAC NATION : paiement', ...lines].join('\n'))
        : Promise.resolve(false),
      this.sendEmail({
        subject: `MAC NATION : ${
          input.kind === 'boutique' ? 'commande boutique' : 'abonnement'
        }`,
        title:
          input.kind === 'boutique' ? 'Commande boutique' : 'Nouvel abonnement',
        lines,
        clientEmail: input.email || undefined,
      }),
    ]);
  }

  async contactMessage(input: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }) {
    const owner = this.ownerPhone();
    const lines = [
      input.name,
      input.email,
      input.phone,
      input.subject,
      input.message,
    ].filter(Boolean);
    await Promise.allSettled([
      this.sendEmail({
        subject: `MAC NATION : contact — ${input.subject}`,
        title: 'Message du site',
        lines,
        clientEmail: input.email || undefined,
      }),
      owner
        ? this.sendSms(owner, ['MAC NATION : contact', ...lines].join('\n'))
        : Promise.resolve(false),
    ]);
  }

  async applicationCreated(input: {
    name: string;
    phone: string;
    email: string;
    jobTitle: string;
  }) {
    const owner = this.ownerPhone();
    const lines = [
      input.name,
      input.phone,
      input.email,
      input.jobTitle,
      'Voir le CV dans le backoffice · Candidatures',
    ];
    await Promise.allSettled([
      this.sendEmail({
        subject: `MAC NATION : candidature ${input.jobTitle}`,
        title: 'Nous avons bien reçu ta candidature',
        lines,
        clientEmail: input.email || undefined,
      }),
      owner
        ? this.sendSms(owner, ['MAC NATION : candidature', ...lines].join('\n'))
        : Promise.resolve(false),
    ]);
  }
}
