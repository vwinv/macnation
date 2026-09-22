import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { OptionalAuthGuard } from '../auth/auth.guard';
import { CurrentClient } from '../auth/current-client.decorator';
import type { Client } from '../store/store.types';
import { CheckoutDto } from './checkout.dto';
import { CheckoutService } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post()
  @HttpCode(200)
  @UseGuards(OptionalAuthGuard)
  create(@Body() dto: CheckoutDto, @CurrentClient() client?: Client) {
    return this.checkout.create(dto, client);
  }
}
