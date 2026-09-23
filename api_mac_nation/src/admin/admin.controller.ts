import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CatalogService, type UploadedPhoto } from '../catalog/catalog.service';
import { AdminGuard } from '../auth/admin.guard';
import {
  asInvoiceLines,
  formatFcfa,
  isExpenseCategory,
  isPaymentMethod,
  todayIso,
  type ExpenseCategory,
} from '../common/money';
import { NotifyService } from '../notify/notify.service';
import { paytechException } from '../paytech/paytech.errors';
import { PaytechService } from '../paytech/paytech.service';
import { StoreService } from '../store/store.service';
import type {
  ApplicationStatus,
  BookingStatus,
  InvoiceStatus,
} from '../store/store.types';

const BOOKING_STATUSES: BookingStatus[] = [
  'nouveau',
  'confirme',
  'termine',
  'annule',
];
const INVOICE_STATUSES: InvoiceStatus[] = [
  'brouillon',
  'envoyee',
  'payee',
  'annulee',
];
const APPLICATION_STATUSES: ApplicationStatus[] = [
  'nouvelle',
  'vue',
  'retenue',
  'refusee',
];

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function mimeFromName(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

function parseProductBody(raw: unknown) {
  const payload = (raw || {}) as Record<string, unknown>;
  const priceRaw = payload.price;
  let price: number | undefined;
  if (priceRaw !== undefined && priceRaw !== null && priceRaw !== '') {
    const n = Number(priceRaw);
    price = Number.isFinite(n) ? Math.max(0, Math.round(n)) : undefined;
  }
  let images: string[] | undefined;
  const rawImages = payload.images;
  if (Array.isArray(rawImages)) {
    images = rawImages.map((item) => String(item).trim()).filter(Boolean);
  } else if (typeof rawImages === 'string' && rawImages.trim()) {
    try {
      const parsed = JSON.parse(rawImages) as unknown;
      images = Array.isArray(parsed)
        ? parsed.map((item) => String(item).trim()).filter(Boolean)
        : [rawImages.trim()];
    } catch {
      images = [rawImages.trim()];
    }
  } else if (rawImages === '' || rawImages === '[]') {
    images = [];
  }

  return {
    name: text(payload.name),
    description:
      payload.description === undefined ? undefined : text(payload.description),
    category: payload.category === undefined ? undefined : text(payload.category),
    image: payload.image === undefined ? undefined : text(payload.image),
    images,
    price,
    active:
      payload.active === undefined
        ? undefined
        : payload.active === true || payload.active === 'true',
  };
}

function parsePlanBody(raw: unknown) {
  const payload = (raw || {}) as Record<string, unknown>;
  const priceRaw = payload.price;
  let price: number | undefined;
  if (priceRaw !== undefined && priceRaw !== null && priceRaw !== '') {
    const n = Number(priceRaw);
    price = Number.isFinite(n) ? Math.max(0, Math.round(n)) : undefined;
  }
  let perks: string[] | undefined;
  if (Array.isArray(payload.perks)) {
    perks = payload.perks.map((item) => String(item).trim()).filter(Boolean);
  } else if (typeof payload.perks === 'string') {
    perks = payload.perks
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  const visitsRaw = payload.visits;
  const percentRaw = payload.boutiquePercent;
  return {
    name: text(payload.name),
    period: payload.period === undefined ? undefined : text(payload.period),
    price,
    featured:
      payload.featured === undefined
        ? undefined
        : payload.featured === true || payload.featured === 'true',
    perks,
    visits:
      visitsRaw === undefined || visitsRaw === null || visitsRaw === ''
        ? undefined
        : Math.max(1, Math.round(Number(visitsRaw) || 1)),
    boutiquePercent:
      percentRaw === undefined || percentRaw === null || percentRaw === ''
        ? undefined
        : Math.min(100, Math.max(0, Math.round(Number(percentRaw) || 0))),
    active:
      payload.active === undefined
        ? undefined
        : payload.active === true || payload.active === 'true',
  };
}

function parseServiceBody(raw: unknown) {
  const payload = (raw || {}) as Record<string, unknown>;
  const priceRaw = payload.price;
  let price: number | null | undefined;
  if (priceRaw === null || priceRaw === '') price = null;
  else if (priceRaw !== undefined) {
    const n = Number(priceRaw);
    price = Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
  }
  return {
    name: text(payload.name),
    duration: payload.duration === undefined ? undefined : text(payload.duration),
    description:
      payload.description === undefined ? undefined : text(payload.description),
    category: payload.category === undefined ? undefined : text(payload.category),
    image: payload.image === undefined ? undefined : text(payload.image),
    price,
    priceLabel:
      payload.priceLabel === undefined ? undefined : text(payload.priceLabel) || null,
    active:
      payload.active === undefined
        ? undefined
        : payload.active === true || payload.active === 'true',
  };
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly store: StoreService,
    private readonly paytech: PaytechService,
    private readonly catalog: CatalogService,
    private readonly notify: NotifyService,
  ) {}

  @Get('salon')
  async salon() {
    const snapshot = await this.store.salonSnapshot();
    return {
      ...snapshot,
      paytechReady: this.paytech.configured(),
      paydunyaReady: this.paytech.configured(),
    };
  }

  @Get('bookings')
  async bookings() {
    return { bookings: await this.store.listBookings() };
  }

  @Post('bookings/:id/quote')
  @HttpCode(200)
  async sendBookingQuote(@Param('id') id: string, @Body() body: unknown) {
    const payload = (body || {}) as { amount?: unknown; items?: unknown };
    const raw = payload.amount;
    const amount =
      typeof raw === 'number' || (typeof raw === 'string' && raw.trim())
        ? Number(raw)
        : undefined;
    const result = await this.store.sendBookingQuote(id, {
      items: asInvoiceLines(payload.items),
      amount,
    });
    await this.notify.quoteReady({
      name: result.booking.name,
      phone: result.booking.phone,
      email: result.booking.email,
      serviceName: result.booking.serviceName,
      dateLabel: result.booking.dateLabel,
      time: result.booking.time,
      amountLabel: formatFcfa(result.booking.amount),
    });
    return result;
  }

  @Patch('bookings/:id')
  async updateBooking(@Param('id') id: string, @Body() body: unknown) {
    const status = text((body as { status?: unknown } | null)?.status);
    if (!BOOKING_STATUSES.includes(status as BookingStatus)) {
      throw new BadRequestException('Statut invalide.');
    }
    const booking = await this.store.updateBookingStatus(
      id,
      status as BookingStatus,
    );
    if (!booking) throw new NotFoundException('Rendez-vous introuvable.');
    return { booking };
  }

  @Post('invoices')
  @HttpCode(200)
  async createInvoice(@Body() body: unknown) {
    const payload = (body || {}) as {
      bookingId?: unknown;
      clientName?: unknown;
      clientPhone?: unknown;
      clientEmail?: unknown;
      items?: unknown;
      note?: unknown;
      kind?: unknown;
      planId?: unknown;
    };

    const bookingId = text(payload.bookingId);
    if (bookingId) {
      const invoice = await this.store.invoiceForBooking(bookingId);
      if (!invoice) throw new NotFoundException('Rendez-vous introuvable.');
      return { invoice };
    }

    const clientName = text(payload.clientName);
    const items = asInvoiceLines(payload.items);
    if (!clientName || items.length === 0) {
      throw new BadRequestException('Nom et au moins une ligne sont requis.');
    }

    const kind = text(payload.kind);
    const invoice = await this.store.createWalkInInvoice({
      clientName,
      clientPhone: text(payload.clientPhone),
      clientEmail: text(payload.clientEmail),
      items,
      note: text(payload.note),
      kind:
        kind === 'rdv' ||
        kind === 'boutique' ||
        kind === 'abonnement' ||
        kind === 'caisse'
          ? kind
          : undefined,
      planId: kind === 'abonnement' ? text(payload.planId) || undefined : undefined,
    });
    return { invoice };
  }

  @Get('invoices/:id')
  async invoice(@Param('id') id: string) {
    const invoice = await this.store.getInvoice(id);
    if (!invoice) throw new NotFoundException('Facture introuvable.');
    const booking = invoice.bookingId
      ? await this.store.getBooking(invoice.bookingId)
      : null;
    return { invoice, booking };
  }

  @Patch('invoices/:id')
  async updateInvoice(@Param('id') id: string, @Body() body: unknown) {
    const payload = (body || {}) as {
      items?: unknown;
      status?: unknown;
      note?: unknown;
      amount?: unknown;
    };
    const status = text(payload.status);
    const rawAmount = payload.amount;
    const amount =
      typeof rawAmount === 'number' ||
      (typeof rawAmount === 'string' && rawAmount.trim())
        ? Number(rawAmount)
        : undefined;

    const invoice = await this.store.updateInvoice(id, {
      items: Array.isArray(payload.items)
        ? asInvoiceLines(payload.items)
        : undefined,
      status: INVOICE_STATUSES.includes(status as InvoiceStatus)
        ? (status as InvoiceStatus)
        : undefined,
      note: typeof payload.note === 'string' ? payload.note : undefined,
      amount: Number.isFinite(amount) ? amount : undefined,
    });
    if (!invoice) throw new NotFoundException('Facture introuvable.');
    return { invoice };
  }

  @Post('invoices/:id/paytech')
  @HttpCode(200)
  async invoicePaytech(@Param('id') id: string) {
    try {
      const checkout = await this.paytech.startCheckout({ invoiceId: id });
      return { url: checkout.url, token: checkout.token };
    } catch (error) {
      throw paytechException(
        error,
        'Impossible de créer le paiement Mobile Money.',
        {
          PAYTECH_MISSING:
            'Clés PayTech manquantes. Ajoute PAYTECH_API_KEY et PAYTECH_API_SECRET.',
          AMOUNT_ZERO: 'Montant à 0. Ajuste la facture avant le paiement.',
        },
      );
    }
  }

  @Post('invoices/:id/paydunya')
  @HttpCode(200)
  invoicePaydunya(@Param('id') id: string) {
    return this.invoicePaytech(id);
  }

  @Post('payments')
  @HttpCode(200)
  async createPayment(@Body() body: unknown) {
    const payload = (body || {}) as {
      invoiceId?: unknown;
      method?: unknown;
      amount?: unknown;
      note?: unknown;
      clientName?: unknown;
      clientPhone?: unknown;
      items?: unknown;
      label?: unknown;
      kind?: unknown;
      planId?: unknown;
    };

    if (!isPaymentMethod(payload.method)) {
      throw new BadRequestException('Mode de paiement invalide.');
    }
    const method = payload.method;
    const amount = Number(payload.amount) || 0;
    const note = typeof payload.note === 'string' ? payload.note : undefined;

    let invoiceId = text(payload.invoiceId);
    if (!invoiceId) {
      const items = asInvoiceLines(payload.items);
      const label = text(payload.label);
      const lines =
        items.length > 0
          ? items
          : label && amount > 0
            ? [{ name: label, qty: 1, unitPrice: amount }]
            : [];
      if (lines.length === 0) {
        throw new BadRequestException('Indique une facture ou une vente.');
      }
      const kind = text(payload.kind);
      const invoice = await this.store.createWalkInInvoice({
        clientName: text(payload.clientName) || 'Passage caisse',
        clientPhone: text(payload.clientPhone),
        items: lines,
        note:
          note ??
          (kind === 'boutique'
            ? 'Boutique · retrait au salon Nord Foire'
            : kind === 'abonnement'
              ? 'Abonnement · valable à Nord Foire'
              : 'Vente caisse'),
        kind:
          kind === 'rdv' ||
          kind === 'boutique' ||
          kind === 'abonnement' ||
          kind === 'caisse'
            ? kind
            : undefined,
        planId: kind === 'abonnement' ? text(payload.planId) || undefined : undefined,
      });
      invoiceId = invoice.id;
    }

    const result = await this.store.markInvoicePaid({
      invoiceId,
      method,
      amount: amount || undefined,
      note,
    });
    if (!result) throw new NotFoundException('Facture introuvable.');
    return result;
  }

  @Post('expenses')
  @HttpCode(200)
  async createExpense(@Body() body: unknown) {
    const payload = (body || {}) as {
      category?: unknown;
      amount?: unknown;
      note?: unknown;
      dateIso?: unknown;
    };
    const amount = Number(payload.amount) || 0;
    if (amount <= 0) throw new BadRequestException('Montant invalide.');
    const category: ExpenseCategory = isExpenseCategory(payload.category)
      ? payload.category
      : 'divers';
    const expense = await this.store.addExpense({
      category,
      amount,
      note: text(payload.note),
      dateIso: text(payload.dateIso) || todayIso(),
    });
    return { expense };
  }

  @Delete('expenses/:id')
  async deleteExpense(@Param('id') id: string) {
    const removed = await this.store.deleteExpense(id);
    if (!removed) throw new NotFoundException('Dépense introuvable.');
    return { ok: true };
  }

  @Patch('clients/:id')
  async adjustClient(@Param('id') id: string, @Body() body: unknown) {
    const payload = (body || {}) as {
      pointsDelta?: unknown;
      creditDelta?: unknown;
      note?: unknown;
    };
    const pointsDelta = Number(payload.pointsDelta) || 0;
    const creditDelta = Number(payload.creditDelta) || 0;
    if (!pointsDelta && !creditDelta) {
      throw new BadRequestException('Aucun ajustement.');
    }
    const client = await this.store.adjustClient(id, {
      pointsDelta,
      creditDelta,
      note: text(payload.note),
    });
    if (!client) throw new NotFoundException('Client introuvable.');
    return { client };
  }

  @Patch('applications/:id')
  async updateApplication(@Param('id') id: string, @Body() body: unknown) {
    const status = text((body as { status?: unknown } | null)?.status);
    if (!APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
      throw new BadRequestException('Statut invalide.');
    }
    const application = await this.store.updateApplicationStatus(
      id,
      status as ApplicationStatus,
    );
    if (!application) throw new NotFoundException('Candidature introuvable.');
    return { application };
  }

  @Get('applications/:id/file')
  async applicationFile(
    @Param('id') id: string,
    @Res() res: Response,
    @Query('kind') kind?: string,
  ) {
    const wanted = kind === 'lettre' ? 'lettre' : 'cv';
    const application = await this.store.getApplication(id);
    if (!application) throw new NotFoundException('Candidature introuvable.');
    try {
      const file = await this.store.readApplicationFile(application, wanted);
      if (!file) throw new NotFoundException('Fichier introuvable.');
      if (file.url) {
        res.redirect(file.url);
        return;
      }
      res.setHeader('Content-Type', mimeFromName(file.filename));
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${file.filename.replace(/"/g, '')}"`,
      );
      res.setHeader('Cache-Control', 'private, no-store');
      res.send(file.bytes);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Téléchargement candidature échoué: ${String(error)}`);
      throw new BadGatewayException('Impossible de télécharger le fichier.');
    }
  }

  @Get('services')
  async listServices() {
    return { services: await this.catalog.listAdmin() };
  }

  @Post('services')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 5_000_000 } }))
  async createService(
    @Body() body: unknown,
    @UploadedFile() photo?: UploadedPhoto,
  ) {
    const input = parseServiceBody(body);
    if (!input.name) throw new BadRequestException('Le nom est obligatoire.');
    if (photo) {
      input.image = await this.catalog.storeProductPhoto(photo);
    }
    const service = await this.catalog.createService(input);
    return { service };
  }

  @Patch('services/:id')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 5_000_000 } }))
  async updateService(
    @Param('id') id: string,
    @Body() body: unknown,
    @UploadedFile() photo?: UploadedPhoto,
  ) {
    const input = parseServiceBody(body);
    if (photo) {
      input.image = await this.catalog.storeProductPhoto(photo);
    }
    const service = await this.catalog.updateService(id, input);
    if (!service) throw new NotFoundException('Prestation introuvable.');
    return { service };
  }

  @Delete('services/:id')
  @HttpCode(200)
  async removeService(@Param('id') id: string) {
    const service = await this.catalog.removeService(id);
    if (!service) throw new NotFoundException('Prestation introuvable.');
    return { service };
  }

  @Get('products')
  async listProducts() {
    return { products: await this.catalog.listAdminProducts() };
  }

  @Post('products')
  @HttpCode(200)
  @UseInterceptors(FilesInterceptor('photos', 4, { limits: { fileSize: 5_000_000 } }))
  async createProduct(
    @Body() body: unknown,
    @UploadedFiles() photos?: UploadedPhoto[],
  ) {
    const input = parseProductBody(body);
    if (!input.name) throw new BadRequestException('Le nom est obligatoire.');
    if (input.price == null) {
      throw new BadRequestException('Le prix est obligatoire.');
    }
    const uploaded = await this.catalog.storeProductPhotos(photos);
    if (uploaded.length) {
      input.images = [...(input.images || []), ...uploaded].slice(0, 4);
      input.image = input.images[0];
    }
    const product = await this.catalog.createProduct(input);
    return { product };
  }

  @Patch('products/:id')
  @UseInterceptors(FilesInterceptor('photos', 4, { limits: { fileSize: 5_000_000 } }))
  async updateProduct(
    @Param('id') id: string,
    @Body() body: unknown,
    @UploadedFiles() photos?: UploadedPhoto[],
  ) {
    const input = parseProductBody(body);
    const uploaded = await this.catalog.storeProductPhotos(photos);
    if (uploaded.length || input.images != null) {
      input.images = [...(input.images || []), ...uploaded].slice(0, 4);
      input.image = input.images[0];
    }
    const product = await this.catalog.updateProduct(id, input);
    if (!product) throw new NotFoundException('Produit introuvable.');
    return { product };
  }

  @Delete('products/:id')
  @HttpCode(200)
  async removeProduct(@Param('id') id: string) {
    const product = await this.catalog.removeProduct(id);
    if (!product) throw new NotFoundException('Produit introuvable.');
    return { product };
  }

  @Get('plans')
  async listPlans() {
    return { plans: await this.catalog.listAdminPlans() };
  }

  @Post('plans')
  @HttpCode(200)
  async createPlan(@Body() body: unknown) {
    const input = parsePlanBody(body);
    if (!input.name) throw new BadRequestException('Le nom est obligatoire.');
    if (input.price == null) {
      throw new BadRequestException('Le prix est obligatoire.');
    }
    const plan = await this.catalog.createPlan(input);
    return { plan };
  }

  @Patch('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() body: unknown) {
    const plan = await this.catalog.updatePlan(id, parsePlanBody(body));
    if (!plan) throw new NotFoundException('Abonnement introuvable.');
    return { plan };
  }

  @Delete('plans/:id')
  @HttpCode(200)
  async removePlan(@Param('id') id: string) {
    const plan = await this.catalog.removePlan(id);
    if (!plan) throw new NotFoundException('Abonnement introuvable.');
    return { plan };
  }

  @Get('schedule')
  schedule() {
    return this.store.getSchedule();
  }

  @Put('schedule')
  async saveSchedule(@Body() body: unknown) {
    const payload = (body || {}) as { hours?: unknown };
    if (!Array.isArray(payload.hours)) {
      throw new BadRequestException('Indique les horaires de la semaine.');
    }
    const hours = payload.hours.map((item) => {
      const row = (item || {}) as Record<string, unknown>;
      return {
        weekday: Number(row.weekday),
        closed: row.closed === true || row.closed === 'true',
        openTime: text(row.openTime) || '10:00',
        closeTime: text(row.closeTime) || '21:00',
        pauseStart: text(row.pauseStart) || null,
        pauseEnd: text(row.pauseEnd) || null,
      };
    });
    return this.store.saveHours(hours);
  }

  @Post('closed-dates')
  @HttpCode(200)
  async addClosedDate(@Body() body: unknown) {
    const payload = (body || {}) as Record<string, unknown>;
    return this.store.addClosedDate(text(payload.dateIso), text(payload.note));
  }

  @Delete('closed-dates/:id')
  @HttpCode(200)
  async removeClosedDate(@Param('id') id: string) {
    return this.store.removeClosedDate(id);
  }
}
