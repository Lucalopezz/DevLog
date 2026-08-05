import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UserModule } from '@/user/infrastructure/user.module';
import { EnvConfigModule } from '@/shared/infrastructure/env-config/env-config.module';
import { JwtModule } from '@nestjs/jwt';
import { EnvConfigService } from '@/shared/infrastructure/env-config/env-config.service';
import { JwtTokenService } from './providers/jwt-token.service';
import { AuthenticateUserUseCase } from '../application/usecases/authenticate-user.usecase';
import { AuthGuard } from './auth.guard';

@Module({
  controllers: [AuthController],
  imports: [
    forwardRef(() => UserModule),
    EnvConfigModule,
    // Config do JwtModule
    JwtModule.registerAsync({
      imports: [EnvConfigModule],
      inject: [EnvConfigService],
      useFactory: (envConfig: EnvConfigService) => ({
        secret: envConfig.getJwtSecret(),
        signOptions: {
          expiresIn: envConfig.getJwtExpiresInSeconds(),
        },
      }),
    }),
  ],
  providers: [
    JwtTokenService,
    {
      provide: 'TokenProvider',
      useExisting: JwtTokenService,
    },
    AuthenticateUserUseCase,
    AuthGuard,
  ],
  exports: [AuthGuard, 'TokenProvider'],
})
export class AuthModule {}
