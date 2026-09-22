import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, OptionalAuthGuard } from '../auth/auth.guard';
import { CurrentClient } from '../auth/current-client.decorator';
import type { Client } from '../store/store.types';
import { CreateBookingDto } from './bookings.dto';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get('schedule')
  schedule() {
    return this.bookings.publicSchedule();
  }

  @Get('slots')
  slots(@Query('date') date: string, @Query('service') service?: string) {
    return this.bookings.slots(date || '', service);
  }

  @Get()
  @UseGuards(AuthGuard)
  mine(@CurrentClient() client: Client) {
    return this.bookings.mine(client);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  one(@Param('id') id: string, @CurrentClient() client: Client) {
    return this.bookings.one(id, client);
  }

  @Post(':id/salon')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  acceptSalon(@Param('id') id: string, @CurrentClient() client: Client) {
    return this.bookings.acceptQuoteAtSalon(id, client);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  cancel(@Param('id') id: string, @CurrentClient() client: Client) {
    return this.bookings.cancel(id, client);
  }

  @Post()
  @UseGuards(OptionalAuthGuard)
  create(@Body() dto: CreateBookingDto, @CurrentClient() client?: Client) {
    return this.bookings.create(dto, client);
  }
}
