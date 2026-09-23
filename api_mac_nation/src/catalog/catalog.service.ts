import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  cloudinaryFolder,
  configureCloudinary,
  destroyProductImage,
  uploadProductImage,
} from '../common/cloudinary';
import { durationMinutes } from '../common/schedule';
import {
  ARTICLES,
  findArticle,
  findJob,
  JOBS,
  resolveProductId,
  resolveServiceId,
  REVIEWS,
  SALON,
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

function slugify(value: string) {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'service';
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

  salon() {
    return { ...SALON, image: this.imageUrl(SALON.image) };
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

  async storeProductPhoto(file: UploadedPhoto) {
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
    return uploadProductImage(file.buffer, cloudinaryFolder(this.config));
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

  articles() {
    return ARTICLES.map((item) => ({
      ...item,
      image: this.imageUrl(item.image),
    }));
  }

  article(id: string) {
    const item = findArticle(id);
    return item ? { ...item, image: this.imageUrl(item.image) } : null;
  }

  reviews() {
    return REVIEWS;
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
      salon: this.salon(),
      services: await this.services(),
      products: await this.products(),
      plans: await this.plans(),
      articles: this.articles(),
      reviews: this.reviews(),
      jobs: this.jobs(),
    };
  }
}
