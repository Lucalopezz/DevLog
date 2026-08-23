import { Module } from '@nestjs/common';
import { TechnicalEntryController } from './technical-entry.controller';
import { AuthModule } from '@/auth/infrastructure/auth.module';
import { TagModule } from '@/tag/infrastructure/tag.module';
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
import { AssignTagToTechnicalEntryUseCase } from '../application/usecases/assign-tag-to-technical-entry.usecase';
import { RemoveTagFromTechnicalEntryUseCase } from '../application/usecases/remove-tag-from-technical-entry.usecase';
import { TechnicalEntryTagRepository } from '../domain/repositories/technical-entry-tag.repository';
import { TagRepository } from '@/tag/domain/repositories/tag.repository';
import { ProjectModule } from '@/project/infrastructure/project.module';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';

@Module({
  controllers: [TechnicalEntryController],
  imports: [AuthModule, TagModule, ProjectModule],
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
        projectRepository: ProjectRepository,
        userRepository: UserPrismaRepository,
      ) => {
        return new CreateTechnicalEntryUseCase(
          technicalEntryRepository,
          projectRepository,
          userRepository,
        );
      },
      inject: [
        'TechnicalEntryRepository',
        'ProjectRepository',
        'UserRepository',
      ],
    },
    {
      provide: GetTechnicalEntryUseCase,
      useFactory: (
        technicalEntryRepository: TechnicalEntryRepository,
        technicalEntryTagRepository: TechnicalEntryTagRepository,
      ) => {
        return new GetTechnicalEntryUseCase(
          technicalEntryRepository,
          technicalEntryTagRepository,
        );
      },
      inject: ['TechnicalEntryRepository', 'TechnicalEntryTagRepository'],
    },
    {
      provide: SearchTechnicalEntryUseCase,
      useFactory: (
        technicalEntryRepository: TechnicalEntryRepository,
        technicalEntryTagRepository: TechnicalEntryTagRepository,
      ) => {
        return new SearchTechnicalEntryUseCase(
          technicalEntryRepository,
          technicalEntryTagRepository,
        );
      },
      inject: ['TechnicalEntryRepository', 'TechnicalEntryTagRepository'],
    },
    {
      provide: UpdateTechnicalEntryUseCase,
      useFactory: (
        technicalEntryRepository: TechnicalEntryRepository,
        projectRepository: ProjectRepository,
      ) => {
        return new UpdateTechnicalEntryUseCase(
          technicalEntryRepository,
          projectRepository,
        );
      },
      inject: ['TechnicalEntryRepository', 'ProjectRepository'],
    },
    {
      provide: DeleteTechnicalEntryUseCase,
      useFactory: (technicalEntryRepository: TechnicalEntryRepository) => {
        return new DeleteTechnicalEntryUseCase(technicalEntryRepository);
      },
      inject: ['TechnicalEntryRepository'],
    },
    {
      provide: AssignTagToTechnicalEntryUseCase,
      useFactory: (
        entryRepository: TechnicalEntryRepository,
        tagRepository: TagRepository,
        entryTagRepository: TechnicalEntryTagRepository,
      ) => {
        return new AssignTagToTechnicalEntryUseCase(
          entryRepository,
          tagRepository,
          entryTagRepository,
        );
      },
      inject: [
        'TechnicalEntryRepository',
        'TagRepository',
        'TechnicalEntryTagRepository',
      ],
    },
    {
      provide: RemoveTagFromTechnicalEntryUseCase,
      useFactory: (
        entryRepository: TechnicalEntryRepository,
        tagRepository: TagRepository,
        entryTagRepository: TechnicalEntryTagRepository,
      ) => {
        return new RemoveTagFromTechnicalEntryUseCase(
          entryRepository,
          tagRepository,
          entryTagRepository,
        );
      },
      inject: [
        'TechnicalEntryRepository',
        'TagRepository',
        'TechnicalEntryTagRepository',
      ],
    },
  ],
})
export class TechnicalEntryModule {}
