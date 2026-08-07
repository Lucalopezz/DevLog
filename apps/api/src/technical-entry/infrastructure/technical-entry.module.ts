import { Module } from '@nestjs/common';
import { TechnicalEntryController } from './technical-entry.controller';
import { AuthModule } from '@/auth/infrastructure/auth.module';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserPrismaRepository } from '@/user/infrastructure/database/prisma/repositories/user-prisma.repository';
import { TechnicalEntryPrismaRepository } from './database/prisma/repositories/technicalEntry-prisma.repository';
import { CreateTechnicalEntryUseCase } from '../application/usecases/create-technical-entry.usecase';
import { TechnicalEntryRepository } from '../domain/repositories/technicalEntry.repository';

@Module({
  controllers: [TechnicalEntryController],
  imports: [AuthModule],
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
      provide: 'TechnicalEntryRepository',
      useFactory: (prismaService: PrismaService) => {
        return new TechnicalEntryPrismaRepository(prismaService);
      },
      inject: ['PrismaService'],
    },
    {
      provide: CreateTechnicalEntryUseCase,
      useFactory: (
        technicalEntryRepository: TechnicalEntryRepository,
        userRepository: UserPrismaRepository,
      ) => {
        return new CreateTechnicalEntryUseCase(
          technicalEntryRepository,
          userRepository,
        );
      },
      inject: ['TechnicalEntryRepository', 'UserRepository'],
    },
  ],
})
export class TechnicalEntryModule {}
