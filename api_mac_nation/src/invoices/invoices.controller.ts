import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { StoreService } from '../store/store.service';

/** Public read used by the website /payer/[id] page before paying. */
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly store: StoreService) {}

  @Get(':id')
  async one(@Param('id') id: string) {
    const invoice = await this.store.getInvoice(id);
    if (!invoice) throw new NotFoundException('Facture introuvable.');
    return invoice;
  }
}
