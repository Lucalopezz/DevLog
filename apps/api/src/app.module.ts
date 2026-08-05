import { Module } from '@nestjs/common';
import { EnvConfigModule } from './shared/infrastructure/env-config/env-config.module';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { UserModule } from './user/infrastructure/user.module';
import { AuthModule } from './auth/infrastructure/auth.module';

@Module({
  imports: [EnvConfigModule, DatabaseModule, UserModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
