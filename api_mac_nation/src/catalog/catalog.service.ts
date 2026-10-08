import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  cloudinaryFolder,
  configureCloudinary,
  destroyProductImage,
  siteFolder,
  uploadProductImage,
} from '../common/cloudinary';
import { durationMinutes } from '../common/schedule';
import {
  ARTICLES,
  DEFAULT_SITE_CONTENT,
  findArticle,
  findJob,
  JOBS,
  resolveProductId,
  resolveServiceId,
  REVIEWS,
  SALON,
  type CatalogReview,
  type SiteBrandValue,
  type SiteContentPayload,
  type SiteCtaItem,
  type SiteHistoryItem,
} from './catalog.data';

const DEFAULT_IMAGE = '/photos/people/people-cut.jpg';
const DEFAULT_PRODUCT_IMAGE = '/images/product-pomade.png';
const MAX_PRODUCT_PHOTOS = 4;
const PRODUCT_PHOTO_MAX_BYTES = 5_000_000;
const PRODUCT_PHOTO_NAME = /^[a-f0-9-]{36}\.(jpe?g|png|webp)$/i;

export type UploadedPhoto = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

function productPhotoDir() {
  return join(process.cwd(), 'uploads', 'products');
}

function productPhotoExt(file: UploadedPhoto) {
  const fromName = file.originalname.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[0];
  if (fromName) return fromName === '.jpeg' ? '.jpg' : fromName;
  if (file.mimetype === 'image/jpeg') return '.jpg';
  if (file.mimetype === 'image/png') return '.png';
  if (file.mimetype === 'image/webp') return '.webp';
  return null;
}

function productPhotoFilename(path: string) {
  const match = path.match(/\/api\/catalog\/photos\/([a-f0-9-]{36}\.(?:jpe?g|png|webp))$/i);
  return match?.[1] || null;
}

function slugify(value: string, fallback = 'service') {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

function formatDateFr(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const day = Number(match[3]);
  const month = Number(match[2]);
  return `${day} ${MONTHS_FR[month - 1] || match[2]} ${match[1]}`;
}

function todayIso() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function asText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asReviews(value: unknown): CatalogReview[] {
  if (!Array.isArray(value)) return DEFAULT_SITE_CONTENT.reviews;
  return value
    .map((item) => {
      const row = (item || {}) as Record<string, unknown>;
      const author = asText(row.author);
      const quote = asText(row.quote);
      if (!author || !quote) return null;
      return {
        author,
        quote,
        rating: asText(row.rating, '5/5'),
        city: asText(row.city, 'Nord Foire, Dakar'),
      };
    })
    .filter((item): item is CatalogReview => Boolean(item));
}

function asCtaItems(value: unknown): SiteCtaItem[] {
  if (!Array.isArray(value) || !value.length) return DEFAULT_SITE_CONTENT.ctaItems;
  const items = value
    .slice(0, 3)
    .map((item, index) => {
      const row = (item || {}) as Record<string, unknown>;
      const fallback = DEFAULT_SITE_CONTENT.ctaItems[index] || DEFAULT_SITE_CONTENT.ctaItems[0];
      return {
        href: asText(row.href, fallback.href),
        kicker: asText(row.kicker, fallback.kicker),
        title: asText(row.title, fallback.title),
        dark: row.dark === undefined ? fallback.dark : row.dark === true || row.dark === 'true',
      };
    })
    .filter((item) => !/equipe|career/i.test(item.href));
  return items.length ? items : DEFAULT_SITE_CONTENT.ctaItems;
}

function asBrandValues(value: unknown): SiteBrandValue[] {
  const defaults = DEFAULT_SITE_CONTENT.brandValues;
  const list = Array.isArray(value) ? value : [];
  return defaults.map((fallback, index) => {
    const row = (list[index] || {}) as Record<string, unknown>;
    return {
      title: asText(row.title, fallback.title),
      body: asText(row.body, fallback.body),
    };
  });
}

function asHistory(value: unknown): SiteHistoryItem[] {
  const defaults = DEFAULT_SITE_CONTENT.brandHistory;
  const list = Array.isArray(value) ? value : [];
  return defaults.map((fallback, index) => {
    const row = (list[index] || {}) as Record<string, unknown>;
    return {
      year: asText(row.year, fallback.year),
      title: asText(row.title, fallback.title),
      body: asText(row.body, fallback.body),
    };
  });
}

function asImageUrl(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asImageList(value: unknown, fallback: string[]) {
  const list = Array.isArray(value) ? value : [];
  return fallback.map((item, index) => asImageUrl(list[index], item));
}

function asImages(value: unknown): SiteContentPayload['images'] {
  const payload = (value || {}) as Record<string, unknown>;
  const defaults = DEFAULT_SITE_CONTENT.images;
  return {
    hero: asImageUrl(payload.hero, defaults.hero),
    brandMosaic: asImageList(payload.brandMosaic, defaults.brandMosaic),
    brandPlace: asImageUrl(payload.brandPlace, defaults.brandPlace),
    brandOffer: asImageUrl(payload.brandOffer, defaults.brandOffer),
    salonBanner: asImageUrl(payload.salonBanner, defaults.salonBanner),
    salonGallery: asImageList(payload.salonGallery, defaults.salonGallery),
    boutique: asImageUrl(payload.boutique, defaults.boutique),
    plans: asImageUrl(payload.plans, defaults.plans),
    cta: asImageUrl(payload.cta, defaults.cta),
  };
}

export function normalizeSiteContent(raw: unknown): SiteContentPayload {
  const payload = (raw || {}) as Record<string, unknown>;
  return {
    heroTitle: asText(payload.heroTitle, DEFAULT_SITE_CONTENT.heroTitle),
    heroCta: asText(payload.heroCta, DEFAULT_SITE_CONTENT.heroCta),
    heroSecondaryCta: (() => {
      const value = asText(
        payload.heroSecondaryCta,
        DEFAULT_SITE_CONTENT.heroSecondaryCta,
      );
      return value === 'Candidater' ? DEFAULT_SITE_CONTENT.heroSecondaryCta : value;
    })(),
    reviewsTitle: asText(payload.reviewsTitle, DEFAULT_SITE_CONTENT.reviewsTitle),
    reviewsSubtitle: asText(
      payload.reviewsSubtitle,
      DEFAULT_SITE_CONTENT.reviewsSubtitle,
    ),
    boutiqueTitle: asText(payload.boutiqueTitle, DEFAULT_SITE_CONTENT.boutiqueTitle),
    boutiqueText: asText(payload.boutiqueText, DEFAULT_SITE_CONTENT.boutiqueText),
    boutiqueCta: asText(payload.boutiqueCta, DEFAULT_SITE_CONTENT.boutiqueCta),
    plansTitle: asText(payload.plansTitle, DEFAULT_SITE_CONTENT.plansTitle),
    plansText: asText(payload.plansText, DEFAULT_SITE_CONTENT.plansText),
    plansCta: asText(payload.plansCta, DEFAULT_SITE_CONTENT.plansCta),
    joinKicker: asText(payload.joinKicker, DEFAULT_SITE_CONTENT.joinKicker),
    joinTitle: asText(payload.joinTitle, DEFAULT_SITE_CONTENT.joinTitle),
    joinText: asText(payload.joinText, DEFAULT_SITE_CONTENT.joinText),
    ctaTitle: asText(payload.ctaTitle, DEFAULT_SITE_CONTENT.ctaTitle),
    ctaItems: asCtaItems(payload.ctaItems),
    brandKicker: asText(payload.brandKicker, DEFAULT_SITE_CONTENT.brandKicker),
    brandTitle: asText(payload.brandTitle, DEFAULT_SITE_CONTENT.brandTitle),
    brandHighlight: asText(payload.brandHighlight, DEFAULT_SITE_CONTENT.brandHighlight),
    brandText: asText(payload.brandText, DEFAULT_SITE_CONTENT.brandText),
    brandValuesTitle: asText(payload.brandValuesTitle, DEFAULT_SITE_CONTENT.brandValuesTitle),
    brandValuesText: asText(payload.brandValuesText, DEFAULT_SITE_CONTENT.brandValuesText),
    brandValues: asBrandValues(payload.brandValues),
    brandPlaceTitle: asText(payload.brandPlaceTitle, DEFAULT_SITE_CONTENT.brandPlaceTitle),
    brandPlaceText: asText(payload.brandPlaceText, DEFAULT_SITE_CONTENT.brandPlaceText),
    brandOfferTitle: asText(payload.brandOfferTitle, DEFAULT_SITE_CONTENT.brandOfferTitle),
    brandOfferText: asText(payload.brandOfferText, DEFAULT_SITE_CONTENT.brandOfferText),
    brandHistoryTitle: asText(payload.brandHistoryTitle, DEFAULT_SITE_CONTENT.brandHistoryTitle),
    brandHistory: asHistory(payload.brandHistory),
    salonName: asText(payload.salonName, DEFAULT_SITE_CONTENT.salonName),
    salonKicker: asText(payload.salonKicker, DEFAULT_SITE_CONTENT.salonKicker),
    salonTitle: asText(payload.salonTitle, DEFAULT_SITE_CONTENT.salonTitle),
    salonSubtitle: asText(payload.salonSubtitle, DEFAULT_SITE_CONTENT.salonSubtitle),
    salonText: asText(payload.salonText, DEFAULT_SITE_CONTENT.salonText),
    salonCta: asText(payload.salonCta, DEFAULT_SITE_CONTENT.salonCta),
    salonGalleryTitle: asText(payload.salonGalleryTitle, DEFAULT_SITE_CONTENT.salonGalleryTitle),
    salonAddress: asText(payload.salonAddress, DEFAULT_SITE_CONTENT.salonAddress),
    salonCity: asText(payload.salonCity, DEFAULT_SITE_CONTENT.salonCity),
    salonCountry: asText(payload.salonCountry, DEFAULT_SITE_CONTENT.salonCountry),
    salonHours: asText(payload.salonHours, DEFAULT_SITE_CONTENT.salonHours),
    salonPhone: asText(payload.salonPhone, DEFAULT_SITE_CONTENT.salonPhone),
    reviews: asReviews(payload.reviews),
    images: asImages(payload.images),
  };
}

export type ServiceInput = {
  name: string;
  duration?: string;
  description?: string;
  category?: string;
  image?: string;
  price?: number | null;
  priceLabel?: string | null;
  active?: boolean;
};

export type ProductInput = {
  name: string;
  description?: string;
  category?: string;
  image?: string;
  images?: string[];
  price?: number;
  active?: boolean;
};

function normalizeProductImages(image?: string | null, extra?: string[] | null) {
  const list = [image, ...(extra || [])]
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  const unique: string[] = [];
  for (const src of list) {
    if (!unique.includes(src)) unique.push(src);
    if (unique.length >= MAX_PRODUCT_PHOTOS) break;
  }
  return unique.length ? unique : [DEFAULT_PRODUCT_IMAGE];
}

export type PlanInput = {
  name: string;
  price?: number;
  period?: string;
  featured?: boolean;
  perks?: string[];
  visits?: number;
  boutiquePercent?: number;
  active?: boolean;
};

export type ArticleInput = {
  title: string;
  category?: string;
  dateIso?: string;
  excerpt?: string;
  body?: string;
  image?: string;
  active?: boolean;
};

function asPerkList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private siteUrl() {
    return (
      this.config.get<string>('SITE_URL') || 'https://mac-nation.vercel.app'
    ).replace(/\/$/, '');
  }

  private imageUrl(path: string): string {
    const value = path || DEFAULT_IMAGE;
    if (value.startsWith('http')) return value;
    return `${this.siteUrl()}${value.startsWith('/') ? value : `/${value}`}`;
  }

  private toPublic(row: {
    slug: string;
    name: string;
    duration: string;
    description: string;
    category: string;
    image: string;
    price: number | null;
    priceLabel: string | null;
  }) {
    return {
      id: row.slug,
      name: row.name,
      duration: row.duration,
      durationMin: durationMinutes(row.duration),
      description: row.description,
      category: row.category,
      image: row.image?.startsWith('http')
        ? row.image
        : row.image || DEFAULT_IMAGE,
      price: row.price,
      priceLabel: row.priceLabel,
    };
  }

  private toAdmin(row: {
    id: string;
    slug: string;
    name: string;
    duration: string;
    description: string;
    category: string;
    image: string;
    price: number | null;
    priceLabel: string | null;
    active: boolean;
    sortOrder: number;
  }) {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      duration: row.duration,
      description: row.description,
      category: row.category,
      image: row.image,
      price: row.price,
      priceLabel: row.priceLabel,
      active: row.active,
      sortOrder: row.sortOrder,
    };
  }

  async salon() {
    const content = await this.siteContent();
    const address = content.salonAddress || SALON.address;
    const city = content.salonCity || SALON.city;
    const country = content.salonCountry || SALON.country;
    return {
      name: content.salonName || SALON.name,
      slug: SALON.slug,
      address: `${address}\n${city}, ${country}`,
      city,
      country,
      hours: content.salonHours || SALON.hours,
      phone: content.salonPhone || SALON.phone,
      image: this.imageUrl(SALON.image),
    };
  }

  async services() {
    const rows = await this.prisma.service.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => this.toPublic(row));
  }

  async service(id: string) {
    const row = await this.findRow(id, true);
    return row ? this.toPublic(row) : null;
  }

  async findRow(id: string, activeOnly = false) {
    const resolved = resolveServiceId(id);
    const row = await this.prisma.service.findFirst({
      where: {
        OR: [{ slug: resolved }, { id: resolved }, { slug: id }, { id }],
        ...(activeOnly ? { active: true } : {}),
      },
    });
    return row;
  }

  async listAdmin() {
    const rows = await this.prisma.service.findMany({
      orderBy: [{ active: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => this.toAdmin(row));
  }

  private async uniqueSlug(base: string, ignoreId?: string) {
    const root = slugify(base);
    let slug = root;
    let n = 2;
    while (true) {
      const existing = await this.prisma.service.findUnique({ where: { slug } });
      if (!existing || existing.id === ignoreId) return slug;
      slug = `${root}-${n++}`;
    }
  }

  async createService(input: ServiceInput) {
    const name = input.name.trim();
    const last = await this.prisma.service.aggregate({ _max: { sortOrder: true } });
    const row = await this.prisma.service.create({
      data: {
        slug: await this.uniqueSlug(name),
        name,
        duration: (input.duration || '30 min').trim() || '30 min',
        description: (input.description || '').trim(),
        category: (input.category || 'Signature').trim() || 'Signature',
        image: (input.image || DEFAULT_IMAGE).trim() || DEFAULT_IMAGE,
        price: input.price ?? null,
        priceLabel: input.priceLabel?.trim() || null,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
        active: input.active !== false,
      },
    });
    return this.toAdmin(row);
  }

  async updateService(id: string, input: Partial<ServiceInput>) {
    const current = await this.findRow(id);
    if (!current) return null;
    const name = input.name?.trim();
    const row = await this.prisma.service.update({
      where: { id: current.id },
      data: {
        ...(name ? { name } : {}),
        ...(input.duration != null
          ? { duration: input.duration.trim() || current.duration }
          : {}),
        ...(input.description != null
          ? { description: input.description.trim() }
          : {}),
        ...(input.category != null
          ? { category: input.category.trim() || current.category }
          : {}),
        ...(input.image != null
          ? { image: input.image.trim() || DEFAULT_IMAGE }
          : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.priceLabel !== undefined
          ? { priceLabel: input.priceLabel?.trim() || null }
          : {}),
        ...(input.active != null ? { active: input.active } : {}),
      },
    });
    if (input.image && input.image !== current.image) {
      await this.removeStoredProductPhoto(current.image);
    }
    return this.toAdmin(row);
  }

  async removeService(id: string) {
    const current = await this.findRow(id);
    if (!current) return null;
    const row = await this.prisma.service.update({
      where: { id: current.id },
      data: { active: false },
    });
    return this.toAdmin(row);
  }

  private toPublicProduct(row: {
    slug: string;
    name: string;
    description: string;
    category: string;
    image: string;
    images?: string[];
    price: number;
  }) {
    const images = normalizeProductImages(row.image, row.images);
    return {
      id: row.slug,
      name: row.name,
      description: row.description,
      category: row.category,
      image: images[0],
      images,
      price: row.price,
    };
  }

  private toAdminProduct(row: {
    id: string;
    slug: string;
    name: string;
    description: string;
    category: string;
    image: string;
    images?: string[];
    price: number;
    active: boolean;
    sortOrder: number;
  }) {
    const images = normalizeProductImages(row.image, row.images);
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      category: row.category,
      image: images[0],
      images,
      price: row.price,
      active: row.active,
      sortOrder: row.sortOrder,
    };
  }

  async findProductRow(id: string, activeOnly = false) {
    const resolved = resolveProductId(id);
    return this.prisma.product.findFirst({
      where: {
        OR: [{ slug: resolved }, { id: resolved }, { slug: id }, { id }],
        ...(activeOnly ? { active: true } : {}),
      },
    });
  }

  private async uniqueProductSlug(base: string, ignoreId?: string) {
    const root = slugify(base);
    let slug = root;
    let n = 2;
    while (true) {
      const existing = await this.prisma.product.findUnique({ where: { slug } });
      if (!existing || existing.id === ignoreId) return slug;
      slug = `${root}-${n++}`;
    }
  }

  async products() {
    const rows = await this.prisma.product.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => this.toPublicProduct(row));
  }

  async product(id: string) {
    const row = await this.findProductRow(id, true);
    return row ? this.toPublicProduct(row) : null;
  }

  async listAdminProducts() {
    const rows = await this.prisma.product.findMany({
      orderBy: [{ active: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => this.toAdminProduct(row));
  }

  async storeProductPhotos(files?: UploadedPhoto[]) {
    const list = (files || []).slice(0, MAX_PRODUCT_PHOTOS);
    const urls: string[] = [];
    for (const file of list) {
      urls.push(await this.storeProductPhoto(file));
    }
    return urls;
  }

  async storeProductPhoto(file: UploadedPhoto, folder?: string) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Ajoute une photo.');
    }
    if (file.size > PRODUCT_PHOTO_MAX_BYTES) {
      throw new BadRequestException('Photo trop lourde. Maximum 5 Mo.');
    }
    if (!productPhotoExt(file)) {
      throw new BadRequestException('Envoie un JPG, PNG ou WEBP.');
    }
    configureCloudinary(this.config);
    return uploadProductImage(file.buffer, folder ?? cloudinaryFolder(this.config));
  }

  async storeSitePhoto(file: UploadedPhoto) {
    return this.storeProductPhoto(file, siteFolder(this.config));
  }

  async readProductPhoto(filename: string) {
    if (!PRODUCT_PHOTO_NAME.test(filename)) return null;
    try {
      return await readFile(join(productPhotoDir(), filename));
    } catch {
      return null;
    }
  }

  async removeStoredProductPhoto(path: string) {
    if (path.includes('res.cloudinary.com')) {
      try {
        configureCloudinary(this.config);
        await destroyProductImage(path);
      } catch {
        /* leftover is harmless */
      }
      return;
    }
    const filename = productPhotoFilename(path);
    if (!filename) return;
    try {
      await unlink(join(productPhotoDir(), filename));
    } catch {
      /* leftover file is harmless */
    }
  }

  async createProduct(input: ProductInput) {
    const name = input.name.trim();
    const price = Math.max(0, Math.round(Number(input.price) || 0));
    const images = normalizeProductImages(input.image, input.images);
    const last = await this.prisma.product.aggregate({ _max: { sortOrder: true } });
    const row = await this.prisma.product.create({
      data: {
        slug: await this.uniqueProductSlug(name),
        name,
        description: (input.description || '').trim(),
        category: (input.category || 'Coiffage').trim() || 'Coiffage',
        image: images[0],
        images,
        price,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
        active: input.active !== false,
      },
    });
    return this.toAdminProduct(row);
  }

  async updateProduct(id: string, input: Partial<ProductInput>) {
    const current = await this.findProductRow(id);
    if (!current) return null;
    const name = input.name?.trim();
    const nextImages =
      input.images != null || input.image != null
        ? normalizeProductImages(input.image, input.images ?? current.images)
        : undefined;
    const row = await this.prisma.product.update({
      where: { id: current.id },
      data: {
        ...(name ? { name } : {}),
        ...(input.description != null
          ? { description: input.description.trim() }
          : {}),
        ...(input.category != null
          ? { category: input.category.trim() || current.category }
          : {}),
        ...(nextImages != null ? { image: nextImages[0], images: nextImages } : {}),
        ...(input.price !== undefined
          ? { price: Math.max(0, Math.round(Number(input.price) || 0)) }
          : {}),
        ...(input.active != null ? { active: input.active } : {}),
      },
    });
    if (nextImages) {
      const previous = normalizeProductImages(current.image, current.images);
      for (const src of previous) {
        if (!nextImages.includes(src)) {
          await this.removeStoredProductPhoto(src);
        }
      }
    }
    return this.toAdminProduct(row);
  }

  async removeProduct(id: string) {
    const current = await this.findProductRow(id);
    if (!current) return null;
    const row = await this.prisma.product.update({
      where: { id: current.id },
      data: { active: false },
    });
    return this.toAdminProduct(row);
  }

  private toPublicPlan(row: {
    slug: string;
    name: string;
    price: number;
    period: string;
    featured: boolean;
    perks: unknown;
    visits: number;
    boutiquePercent: number;
  }) {
    return {
      id: row.slug,
      name: row.name,
      price: row.price,
      period: row.period,
      featured: row.featured,
      perks: asPerkList(row.perks),
      visits: row.visits,
      boutiquePercent: row.boutiquePercent,
    };
  }

  private toAdminPlan(row: {
    id: string;
    slug: string;
    name: string;
    price: number;
    period: string;
    featured: boolean;
    perks: unknown;
    visits: number;
    boutiquePercent: number;
    active: boolean;
    sortOrder: number;
  }) {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      price: row.price,
      period: row.period,
      featured: row.featured,
      perks: asPerkList(row.perks),
      visits: row.visits,
      boutiquePercent: row.boutiquePercent,
      active: row.active,
      sortOrder: row.sortOrder,
    };
  }

  private async uniquePlanSlug(base: string, ignoreId?: string) {
    const root = slugify(base);
    let slug = root === 'service' ? 'abonnement' : root;
    let n = 2;
    while (true) {
      const existing = await this.prisma.plan.findUnique({ where: { slug } });
      if (!existing || existing.id === ignoreId) return slug;
      slug = `${root}-${n++}`;
    }
  }

  private async findPlanRow(id: string, activeOnly = false) {
    return this.prisma.plan.findFirst({
      where: {
        OR: [{ slug: id }, { id }],
        ...(activeOnly ? { active: true } : {}),
      },
    });
  }

  async listAdminPlans() {
    const rows = await this.prisma.plan.findMany({
      orderBy: [{ active: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => this.toAdminPlan(row));
  }

  async createPlan(input: PlanInput) {
    const name = input.name.trim();
    const price = Math.max(0, Math.round(Number(input.price) || 0));
    const last = await this.prisma.plan.aggregate({ _max: { sortOrder: true } });
    if (input.featured) {
      await this.prisma.plan.updateMany({ data: { featured: false } });
    }
    const row = await this.prisma.plan.create({
      data: {
        slug: await this.uniquePlanSlug(name),
        name,
        price,
        period: (input.period || 'par mois').trim() || 'par mois',
        featured: input.featured === true,
        perks: input.perks || [],
        visits: Math.max(1, Math.round(Number(input.visits) || 4)),
        boutiquePercent: Math.min(
          100,
          Math.max(0, Math.round(Number(input.boutiquePercent) || 0)),
        ),
        sortOrder: (last._max.sortOrder ?? -1) + 1,
        active: input.active !== false,
      },
    });
    return this.toAdminPlan(row);
  }

  async updatePlan(id: string, input: Partial<PlanInput>) {
    const current = await this.findPlanRow(id);
    if (!current) return null;
    const name = input.name?.trim();
    if (input.featured) {
      await this.prisma.plan.updateMany({
        where: { NOT: { id: current.id } },
        data: { featured: false },
      });
    }
    const row = await this.prisma.plan.update({
      where: { id: current.id },
      data: {
        ...(name ? { name } : {}),
        ...(input.price != null
          ? { price: Math.max(0, Math.round(Number(input.price) || 0)) }
          : {}),
        ...(input.period != null
          ? { period: input.period.trim() || 'par mois' }
          : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.perks ? { perks: input.perks } : {}),
        ...(input.visits != null
          ? { visits: Math.max(1, Math.round(Number(input.visits) || 1)) }
          : {}),
        ...(input.boutiquePercent != null
          ? {
              boutiquePercent: Math.min(
                100,
                Math.max(0, Math.round(Number(input.boutiquePercent) || 0)),
              ),
            }
          : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
    return this.toAdminPlan(row);
  }

  async removePlan(id: string) {
    const current = await this.findPlanRow(id);
    if (!current) return null;
    const row = await this.prisma.plan.update({
      where: { id: current.id },
      data: { active: false, featured: false },
    });
    return this.toAdminPlan(row);
  }

  async plans() {
    const rows = await this.prisma.plan.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => this.toPublicPlan(row));
  }

  async plan(id: string) {
    const row = await this.findPlanRow(id, true);
    return row ? this.toPublicPlan(row) : null;
  }

  private async ensureArticles() {
    const count = await this.prisma.article.count();
    if (count > 0) return;
    await this.prisma.article.createMany({
      data: ARTICLES.map((item, index) => ({
        slug: item.id,
        title: item.title,
        category: item.category,
        dateIso: item.dateIso,
        excerpt: item.excerpt,
        body: item.body,
        image: item.image,
        sortOrder: index,
        active: true,
      })),
      skipDuplicates: true,
    });
  }

  private toPublicArticle(row: {
    slug: string;
    title: string;
    category: string;
    dateIso: string;
    excerpt: string;
    body: string;
    image: string;
  }) {
    return {
      id: row.slug,
      title: row.title,
      category: row.category,
      date: formatDateFr(row.dateIso),
      dateIso: row.dateIso,
      excerpt: row.excerpt,
      body: row.body,
      image: this.imageUrl(row.image),
    };
  }

  private toAdminArticle(row: {
    id: string;
    slug: string;
    title: string;
    category: string;
    dateIso: string;
    excerpt: string;
    body: string;
    image: string;
    active: boolean;
    sortOrder: number;
    pushNotifiedAt?: Date | null;
  }) {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      date: formatDateFr(row.dateIso),
      dateIso: row.dateIso,
      excerpt: row.excerpt,
      body: row.body,
      image: row.image,
      active: row.active,
      sortOrder: row.sortOrder,
      pushNotifiedAt: row.pushNotifiedAt ? row.pushNotifiedAt.toISOString() : null,
    };
  }

  private async uniqueArticleSlug(base: string, ignoreId?: string) {
    const root = slugify(base, 'article');
    let slug = root;
    let n = 2;
    while (true) {
      const existing = await this.prisma.article.findUnique({ where: { slug } });
      if (!existing || existing.id === ignoreId) return slug;
      slug = `${root}-${n++}`;
    }
  }

  async findArticleRow(id: string, activeOnly = false) {
    return this.prisma.article.findFirst({
      where: {
        OR: [{ slug: id }, { id }],
        ...(activeOnly ? { active: true } : {}),
      },
    });
  }

  async listAdminArticles() {
    await this.ensureArticles();
    const rows = await this.prisma.article.findMany({
      orderBy: [{ active: 'desc' }, { dateIso: 'desc' }, { sortOrder: 'asc' }],
    });
    return rows.map((row) => this.toAdminArticle(row));
  }

  async createArticle(input: ArticleInput) {
    const title = input.title.trim();
    const last = await this.prisma.article.aggregate({ _max: { sortOrder: true } });
    const dateIso = /^\d{4}-\d{2}-\d{2}$/.test(input.dateIso || '')
      ? (input.dateIso as string)
      : todayIso();
    const row = await this.prisma.article.create({
      data: {
        slug: await this.uniqueArticleSlug(title),
        title,
        category: (input.category || 'Nos actus').trim() || 'Nos actus',
        dateIso,
        excerpt: (input.excerpt || '').trim(),
        body: (input.body || input.excerpt || '').trim(),
        image: (input.image || DEFAULT_IMAGE).trim() || DEFAULT_IMAGE,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
        active: input.active !== false,
      },
    });
    return this.toAdminArticle(row);
  }

  async updateArticle(id: string, input: Partial<ArticleInput>) {
    const current = await this.findArticleRow(id);
    if (!current) return null;
    const title = input.title?.trim();
    const dateIso =
      input.dateIso !== undefined
        ? /^\d{4}-\d{2}-\d{2}$/.test(input.dateIso)
          ? input.dateIso
          : current.dateIso
        : undefined;
    const row = await this.prisma.article.update({
      where: { id: current.id },
      data: {
        ...(title ? { title } : {}),
        ...(input.category != null
          ? { category: input.category.trim() || current.category }
          : {}),
        ...(dateIso ? { dateIso } : {}),
        ...(input.excerpt != null ? { excerpt: input.excerpt.trim() } : {}),
        ...(input.body != null ? { body: input.body.trim() } : {}),
        ...(input.image != null
          ? { image: input.image.trim() || DEFAULT_IMAGE }
          : {}),
        ...(input.active != null ? { active: input.active } : {}),
      },
    });
    if (input.image && input.image !== current.image) {
      await this.removeStoredProductPhoto(current.image);
    }
    return this.toAdminArticle(row);
  }

  async removeArticle(id: string) {
    const current = await this.findArticleRow(id);
    if (!current) return null;
    await this.prisma.article.delete({ where: { id: current.id } });
    await this.removeStoredProductPhoto(current.image);
    return this.toAdminArticle(current);
  }

  async articles() {
    try {
      await this.ensureArticles();
      const rows = await this.prisma.article.findMany({
        where: { active: true },
        orderBy: [{ dateIso: 'desc' }, { sortOrder: 'asc' }],
      });
      if (rows.length) return rows.map((row) => this.toPublicArticle(row));
    } catch {
      /* fallback to static copy */
    }
    return ARTICLES.map((item) => ({
      ...item,
      image: this.imageUrl(item.image),
    }));
  }

  async article(id: string) {
    try {
      await this.ensureArticles();
      const row = await this.findArticleRow(id, true);
      if (row) return this.toPublicArticle(row);
    } catch {
      /* fallback to static copy */
    }
    const item = findArticle(id);
    return item ? { ...item, image: this.imageUrl(item.image) } : null;
  }

  async reviews() {
    const content = await this.siteContent();
    return content.reviews.length ? content.reviews : REVIEWS;
  }

  async siteContent() {
    try {
      let row = await this.prisma.siteContent.findUnique({
        where: { id: 'home' },
      });
      if (!row) {
        row = await this.prisma.siteContent.create({
          data: { id: 'home', payload: DEFAULT_SITE_CONTENT as Prisma.InputJsonValue },
        });
      }
      return normalizeSiteContent(row.payload);
    } catch {
      return DEFAULT_SITE_CONTENT;
    }
  }

  async saveSiteContent(raw: unknown) {
    const incoming =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    const current = await this.siteContent();
    const incomingImages =
      incoming.images && typeof incoming.images === 'object' && !Array.isArray(incoming.images)
        ? (incoming.images as Record<string, unknown>)
        : {};
    const payload = normalizeSiteContent({
      ...current,
      ...incoming,
      images: { ...current.images, ...incomingImages },
    });
    const row = await this.prisma.siteContent.upsert({
      where: { id: 'home' },
      create: { id: 'home', payload: payload as Prisma.InputJsonValue },
      update: { payload: payload as Prisma.InputJsonValue },
    });
    return normalizeSiteContent(row.payload);
  }

  async productReviews(id: string, clientId?: string) {
    const product = await this.findProductRow(id, true);
    if (!product) return null;
    const [comments, ratings] = await Promise.all([
      this.prisma.productReview.findMany({
        where: { productId: product.id },
        include: { client: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.productRating.findMany({
        where: { productId: product.id },
        include: { client: { select: { name: true } } },
      }),
    ]);
    const ratingByClient = new Map(ratings.map((row) => [row.clientId, row.rating]));
    const commented = new Set(comments.map((row) => row.clientId));
    const list = [
      ...comments.map((row) => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        rating: ratingByClient.get(row.clientId) ?? null,
        comment: row.comment,
        name: row.client.name,
      })),
      ...ratings
        .filter((row) => !commented.has(row.clientId))
        .map((row) => ({
          id: row.id,
          createdAt: row.createdAt.toISOString(),
          rating: row.rating,
          comment: '',
          name: row.client.name,
        })),
    ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const average =
      ratings.length > 0
        ? Math.round((ratings.reduce((sum, row) => sum + row.rating, 0) / ratings.length) * 10) / 10
        : 0;
    const mine = clientId ? ratings.find((row) => row.clientId === clientId) : undefined;
    return {
      reviews: list,
      average,
      count: list.length,
      myRating: mine?.rating ?? null,
    };
  }

  async addProductFeedback(
    id: string,
    clientId: string,
    input: { rating: number | null; comment: string },
  ) {
    const product = await this.findProductRow(id, true);
    if (!product) return null;
    const comment = input.comment.trim().slice(0, 800);
    const rating =
      input.rating == null
        ? null
        : Math.min(5, Math.max(1, Math.round(Number(input.rating) || 0)));
    const existing = await this.prisma.productRating.findUnique({
      where: { productId_clientId: { productId: product.id, clientId } },
    });
    if (rating != null && existing && !comment) {
      throw new BadRequestException('Tu as déjà laissé une note pour ce produit.');
    }
    if (rating != null && !existing) {
      await this.prisma.productRating.create({
        data: { productId: product.id, clientId, rating },
      });
    }
    if (comment) {
      await this.prisma.productReview.create({
        data: { productId: product.id, clientId, comment },
      });
    }
    return this.productReviews(id, clientId);
  }

  async serviceReviews(id: string, clientId?: string) {
    const service = await this.findRow(id, true);
    if (!service) return null;
    const [comments, ratings] = await Promise.all([
      this.prisma.serviceReview.findMany({
        where: { serviceId: service.id },
        include: { client: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceRating.findMany({
        where: { serviceId: service.id },
        include: { client: { select: { name: true } } },
      }),
    ]);
    const ratingByClient = new Map(ratings.map((row) => [row.clientId, row.rating]));
    const commented = new Set(comments.map((row) => row.clientId));
    const list = [
      ...comments.map((row) => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        rating: ratingByClient.get(row.clientId) ?? null,
        comment: row.comment,
        name: row.client.name,
      })),
      ...ratings
        .filter((row) => !commented.has(row.clientId))
        .map((row) => ({
          id: row.id,
          createdAt: row.createdAt.toISOString(),
          rating: row.rating,
          comment: '',
          name: row.client.name,
        })),
    ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const average =
      ratings.length > 0
        ? Math.round((ratings.reduce((sum, row) => sum + row.rating, 0) / ratings.length) * 10) / 10
        : 0;
    const mine = clientId ? ratings.find((row) => row.clientId === clientId) : undefined;
    return {
      reviews: list,
      average,
      count: list.length,
      myRating: mine?.rating ?? null,
    };
  }

  async addServiceFeedback(
    id: string,
    clientId: string,
    input: { rating: number | null; comment: string },
  ) {
    const service = await this.findRow(id, true);
    if (!service) return null;
    const comment = input.comment.trim().slice(0, 800);
    const rating =
      input.rating == null
        ? null
        : Math.min(5, Math.max(1, Math.round(Number(input.rating) || 0)));
    const existing = await this.prisma.serviceRating.findUnique({
      where: { serviceId_clientId: { serviceId: service.id, clientId } },
    });
    if (rating != null && existing && !comment) {
      throw new BadRequestException('Tu as déjà laissé une note pour cette prestation.');
    }
    if (rating != null && !existing) {
      await this.prisma.serviceRating.create({
        data: { serviceId: service.id, clientId, rating },
      });
    }
    if (comment) {
      await this.prisma.serviceReview.create({
        data: { serviceId: service.id, clientId, comment },
      });
    }
    return this.serviceReviews(id, clientId);
  }

  jobs() {
    return JOBS;
  }

  job(id: string) {
    return findJob(id) || null;
  }

  async all() {
    return {
      salon: await this.salon(),
      services: await this.services(),
      products: await this.products(),
      plans: await this.plans(),
      articles: await this.articles(),
      reviews: await this.reviews(),
      jobs: this.jobs(),
    };
  }
}
