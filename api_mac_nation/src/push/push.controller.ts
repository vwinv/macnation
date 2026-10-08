import { Body, Controller, Delete, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { OptionalAuthGuard, type AuthedRequest } from '../auth/auth.guard';
import { RegisterPushDto, UnregisterPushDto } from './push.dto';
import { PushService } from './push.service';

@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Post('tokens')
  @HttpCode(200)
  @UseGuards(OptionalAuthGuard)
  register(@Body() dto: RegisterPushDto, @Req() req: AuthedRequest) {
    return this.push.registerToken({
      token: dto.token,
      platform: dto.platform,
      clientId: req.authClient?.id,
    });
  }

  @Delete('tokens')
  @HttpCode(200)
  unregister(@Body() dto: UnregisterPushDto) {
    return this.push.unregisterToken(dto.token);
  }
}
