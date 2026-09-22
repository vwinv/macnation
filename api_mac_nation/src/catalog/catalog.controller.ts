import { Controller, Get, Header, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('photos/:file')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async photo(@Param('file') file: string, @Res() res: Response) {
    const bytes = await this.catalog.readProductPhoto(file);
    if (!bytes) throw new NotFoundException('Photo introuvable.');
    const lower = file.toLowerCase();
    const type = lower.endsWith('.png')
      ? 'image/png'
      : lower.endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg';
    res.setHeader('Content-Type', type);
    res.send(bytes);
  }

  @Get()
  all() {
    return this.catalog.all();
  }

  @Get('salon')
  salon() {
    return this.catalog.salon();
  }

  @Get('services')
  services() {
    return this.catalog.services();
  }

  @Get('services/:id')
  async service(@Param('id') id: string) {
    const item = await this.catalog.service(id);
    if (!item) throw new NotFoundException('Prestation introuvable.');
    return item;
  }

  @Get('products')
  products() {
    return this.catalog.products();
  }

  @Get('products/:id')
  async product(@Param('id') id: string) {
    const item = await this.catalog.product(id);
    if (!item) throw new NotFoundException('Produit introuvable.');
    return item;
  }

  @Get('plans')
  plans() {
    return this.catalog.plans();
  }

  @Get('plans/:id')
  async plan(@Param('id') id: string) {
    const item = await this.catalog.plan(id);
    if (!item) throw new NotFoundException('Abonnement introuvable.');
    return item;
  }

  @Get('articles')
  articles() {
    return this.catalog.articles();
  }

  @Get('articles/:id')
  article(@Param('id') id: string) {
    const item = this.catalog.article(id);
    if (!item) throw new NotFoundException('Article introuvable.');
    return item;
  }

  @Get('reviews')
  reviews() {
    return this.catalog.reviews();
  }

  @Get('jobs')
  jobs() {
    return this.catalog.jobs();
  }

  @Get('jobs/:id')
  job(@Param('id') id: string) {
    const item = this.catalog.job(id);
    if (!item) throw new NotFoundException('Poste introuvable.');
    return item;
  }
}
