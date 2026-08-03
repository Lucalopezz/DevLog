import { Module } from '@nestjs/common';
import { EnvConfigModule } from './shared/infrastructure/env-config/env-config.module';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { UserModule } from './user/infrastructure/user.module';

@Module({
  imports: [EnvConfigModule, DatabaseModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
