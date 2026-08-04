import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserPrismaRepository } from './database/prisma/repositories/user-prisma.repository';
import { BcryptjsHashProvider } from '@/shared/application/providers/bycryptjs-hash.provider';
import { CreateUserUseCase } from '../application/usecases/create-user.usecase';
import { GetCurrentUserUseCase } from '../application/usecases/get-current-user.usecase';
import { UpdateUserPasswordUseCase } from '../application/usecases/update-user-password.usecase';
import { UpdateUserUseCase } from '../application/usecases/update-user.usecase';
import { UserRepository } from '../domain/repositories/user.repository';
import { HashProvider } from '@/shared/application/providers/hash-provaider';

@Module({
  controllers: [UserController],
  providers: [
    {
      provide: 'PrismaService',
      useClass: PrismaService,
    },
    {
      provide: 'UserRepository',
      useFactory: (prismaService: PrismaService) => {
        return new UserPrismaRepository(prismaService);
      },
      inject: ['PrismaService'],
    },
    {
      provide: 'HashProvider',
      useClass: BcryptjsHashProvider,
    },
    {
      provide: CreateUserUseCase,
      useFactory: (
        userRepository: UserRepository,
        hashProvider: HashProvider,
      ) => {
        return new CreateUserUseCase(userRepository, hashProvider);
      },
      inject: ['UserRepository', 'HashProvider'],
    },
    {
      provide: GetCurrentUserUseCase,
      useFactory: (userRepository: UserRepository) => {
        return new GetCurrentUserUseCase(userRepository);
      },
      inject: ['UserRepository'],
    },
    {
      provide: UpdateUserUseCase,
      useFactory: (userRepository: UserRepository) => {
        return new UpdateUserUseCase(userRepository);
      },
      inject: ['UserRepository'],
    },
    {
      provide: UpdateUserPasswordUseCase,
      useFactory: (
        userRepository: UserRepository,
        hashProvider: HashProvider,
      ) => {
        return new UpdateUserPasswordUseCase(userRepository, hashProvider);
      },
      inject: ['UserRepository', 'HashProvider'],
    },
  ],
})
export class UserModule {}
