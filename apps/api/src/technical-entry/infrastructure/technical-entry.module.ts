import { Module } from '@nestjs/common';
import { TechnicalEntryController } from './technical-entry.controller';
import { AuthModule } from '@/auth/infrastructure/auth.module';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserPrismaRepository } from '@/user/infrastructure/database/prisma/repositories/user-prisma.repository';
import { TechnicalEntryPrismaRepository } from './database/prisma/repositories/technical-entry-prisma.repository';
import { TechnicalEntryTagPrismaRepository } from './database/prisma/repositories/technical-entry-tag-prisma.repository';
import { CreateTechnicalEntryUseCase } from '../application/usecases/create-technical-entry.usecase';
import { GetTechnicalEntryUseCase } from '../application/usecases/get-technical-entry.usecase';
import { UpdateTechnicalEntryUseCase } from '../application/usecases/update-technical-entry.usecase';
import { DeleteTechnicalEntryUseCase } from '../application/usecases/delete-technical-entry.usecase';
import { TechnicalEntryRepository } from '../domain/repositories/technical-entry.repository';
import { SearchTechnicalEntryUseCase } from '../application/usecases/search-technical-entry.usecase';

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
      provide: 'TechnicalEntryTagRepository',
      useFactory: (prismaService: PrismaService) => {
        return new TechnicalEntryTagPrismaRepository(prismaService);
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
    {
      provide: GetTechnicalEntryUseCase,
      useFactory: (technicalEntryRepository: TechnicalEntryRepository) => {
        return new GetTechnicalEntryUseCase(technicalEntryRepository);
      },
      inject: ['TechnicalEntryRepository'],
    },
    {
      provide: SearchTechnicalEntryUseCase,
      useFactory: (technicalEntryRepository: TechnicalEntryRepository) => {
        return new SearchTechnicalEntryUseCase(technicalEntryRepository);
      },
      inject: ['TechnicalEntryRepository'],
    },
    {
      provide: UpdateTechnicalEntryUseCase,
      useFactory: (technicalEntryRepository: TechnicalEntryRepository) => {
        return new UpdateTechnicalEntryUseCase(technicalEntryRepository);
      },
      inject: ['TechnicalEntryRepository'],
    },
    {
      provide: DeleteTechnicalEntryUseCase,
      useFactory: (technicalEntryRepository: TechnicalEntryRepository) => {
        return new DeleteTechnicalEntryUseCase(technicalEntryRepository);
      },
      inject: ['TechnicalEntryRepository'],
    },
  ],
})
export class TechnicalEntryModule {}
