import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule } from '../clients/clients.module';
import { NotifyModule } from '../notify/notify.module';
import { OauthModule } from '../oauth/oauth.module';
import { CompteController } from './compte.controller';

@Module({
  imports: [AuthModule, ClientsModule, OauthModule, NotifyModule],
  controllers: [CompteController],
})
export class CompteModule {}
