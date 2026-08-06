import { Module } from '@nestjs/common';
import { EnvConfigModule } from './shared/infrastructure/env-config/env-config.module';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { UserModule } from './user/infrastructure/user.module';
import { AuthModule } from './auth/infrastructure/auth.module';
import { TechnicalEntryModule } from './technical-entry/infrastructure/technical-entry.module';

@Module({
  imports: [EnvConfigModule, DatabaseModule, UserModule, AuthModule, TechnicalEntryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
