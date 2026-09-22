import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentClient } from '../auth/current-client.decorator';
import type { Client } from '../store/store.types';
import { UpdateProfileDto } from './clients.dto';
import { ClientsService } from './clients.service';

@Controller('me')
@UseGuards(AuthGuard)
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  me(@CurrentClient() client: Client) {
    return this.clients.dashboard(client);
  }

  @Patch()
  update(@CurrentClient() client: Client, @Body() dto: UpdateProfileDto) {
    return this.clients.update(client, dto);
  }

  @Post('redeem')
  redeem(@CurrentClient() client: Client) {
    return this.clients.redeem(client);
  }

  @Delete('membership')
  cancelMembership(@CurrentClient() client: Client) {
    return this.clients.cancelMembership(client);
  }
}
