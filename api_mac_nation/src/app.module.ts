import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { CareerModule } from './career/career.module';
import { CatalogModule } from './catalog/catalog.module';
import { CheckoutModule } from './checkout/checkout.module';
import { ClientsModule } from './clients/clients.module';
import { CompteModule } from './compte/compte.module';
import { ContactModule } from './contact/contact.module';
import { HealthController } from './health.controller';
import { InvoicesModule } from './invoices/invoices.module';
import { NotifyModule } from './notify/notify.module';
import { OauthModule } from './oauth/oauth.module';
import { PaydunyaModule } from './paydunya/paydunya.module';
import { PaytechModule } from './paytech/paytech.module';
import { PrismaModule } from './prisma/prisma.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StoreModule,
    CatalogModule,
    NotifyModule,
    OauthModule,
    PaydunyaModule,
    PaytechModule,
    AuthModule,
    BookingsModule,
    CheckoutModule,
    ClientsModule,
    CompteModule,
    ContactModule,
    AdminModule,
    CareerModule,
    InvoicesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
