import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import { NotifyService } from '../notify/notify.service';

const SUBJECTS: Record<string, string> = {
  reservation: 'Réservation',
  domicile: 'Coiffure à domicile',
  abonnement: 'Abonnement',
  boutique: 'Boutique',
  recrutement: 'Recrutement',
};

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

@Controller('contact')
export class ContactController {
  constructor(private readonly notify: NotifyService) {}

  @Post()
  @HttpCode(200)
  async send(@Body() body: unknown) {
    const payload = (body || {}) as Record<string, unknown>;
    const name = text(payload.name);
    const email = text(payload.email);
    const phone = text(payload.phone);
    const message = text(payload.message);
    const subjectKey = text(payload.subject);
    const subject = SUBJECTS[subjectKey] || subjectKey || 'Message';

    if (!name || !email || !message) {
      throw new BadRequestException(
        'Merci de renseigner le nom, l’email et le message.',
      );
    }
    if (!email.includes('@') || email.length < 5) {
      throw new BadRequestException('Indique un e-mail valide.');
    }

    await this.notify.contactMessage({
      name,
      email,
      phone,
      subject,
      message,
    });

    return { ok: true };
  }
}
