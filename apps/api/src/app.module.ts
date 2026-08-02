import { Module } from '@nestjs/common';
import { EnvConfigModule } from './shared/infrastructure/env-config/env-config.module';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { InfrastructureModule } from './user/infrastructure/user.module';

@Module({
  imports: [EnvConfigModule, DatabaseModule, InfrastructureModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
