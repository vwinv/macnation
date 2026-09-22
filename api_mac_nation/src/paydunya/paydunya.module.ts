import { Module } from '@nestjs/common';
import { PaydunyaController } from './paydunya.controller';
import { PaydunyaService } from './paydunya.service';

@Module({
  controllers: [PaydunyaController],
  providers: [PaydunyaService],
  exports: [PaydunyaService],
})
export class PaydunyaModule {}
