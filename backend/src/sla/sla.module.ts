import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SlaService } from './sla.service';
import { SlaProcessor } from './sla.processor';
import { SLA_QUEUE } from './sla.processor';

@Module({
  imports: [BullModule.registerQueue({ name: SLA_QUEUE })],
  providers: [SlaService, SlaProcessor],
  exports: [SlaService],
})
export class SlaModule {}
