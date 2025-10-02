import { Module, Global } from '@nestjs/common';
import { TemporalService } from './temporal.service';

@Global()
@Module({
  providers: [TemporalService],
  exports: [TemporalService],
})
export class TemporalModule {}
