import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvConfigService } from './env-config.service';

@Module({
  imports: [
    // The ConfigModule is configured to load environment variables from a .env file.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
  ],
  exports: [EnvConfigService],
  providers: [EnvConfigService],
})
export class EnvConfigModule {}
