import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyGlobalConfig } from './global-config';
import { EnvConfigService } from './shared/infrastructure/env-config/env-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const envConfigService = app.get(EnvConfigService);

  applyGlobalConfig(app, envConfigService);

  await app.listen(envConfigService.getAppPort());
}
void bootstrap();
