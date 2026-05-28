import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SlaService } from './sla.service';

export const SLA_QUEUE = 'sla-monitor';

@Processor(SLA_QUEUE)
@Injectable()
export class SlaProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(SlaProcessor.name);

  constructor(
    @InjectQueue(SLA_QUEUE) private readonly queue: Queue,
    private readonly slaService: SlaService,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    try {
      const repeatables = await this.queue.getRepeatableJobs();
      for (const job of repeatables) {
        await this.queue.removeRepeatableByKey(job.key);
      }

      await this.queue.add(
        'check-sla',
        {},
        {
          repeat: { every: 5 * 60 * 1000 },
          jobId: 'sla-monitor-recurring',
        },
      );
      this.logger.log('SLA monitor job scheduled (every 5 minutes)');
    } catch (err) {
      this.logger.warn(
        `SLA monitor scheduling failed (Redis may be unavailable): ${(err as Error).message}`,
      );
    }
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Running SLA check...');
    await this.slaService.runCheck();
  }
}
