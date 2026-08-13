import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';

@Module({
  controllers: [TagController],
  providers: [],
})
export class TagModule {}
