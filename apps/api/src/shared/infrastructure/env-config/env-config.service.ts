import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './env-config.interface';

export class EnvConfigService implements EnvConfig {
  constructor(private configService: ConfigService) {}

  getAppPort(): number {
    return Number(this.configService.get<number>('PORT', 3000));
  }

  getCorsAllowedOrigins(): string[] {
    const origins = (
      this.configService.get<string>('CORS_ALLOWED_ORIGINS') ?? ''
    )
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    // Check if the origins array contains "*" and the environment is not development
    if (origins.includes('*') && this.getNodeEnv() !== 'development') {
      throw new Error(
        'CORS_ALLOWED_ORIGINS cannot contain "*" outside development',
      );
    }
    return origins;
  }
  getJwtExpiresInSeconds(): number {
    return Number(
      this.configService.get<number>('JWT_EXPIRES_IN_SECONDS', 3600),
    );
  }

  getJwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }

    return secret;
  }

  getNodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }
}
