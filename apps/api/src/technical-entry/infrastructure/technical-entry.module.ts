import { Module } from '@nestjs/common';
import { TechnicalEntryController } from './technical-entry.controller';

@Module({
  controllers: [TechnicalEntryController],
  providers: [],
})
export class TechnicalEntryModule {}
