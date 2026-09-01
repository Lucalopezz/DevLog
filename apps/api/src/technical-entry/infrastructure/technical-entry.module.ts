import { Module } from '@nestjs/common';
import { TechnicalEntryController } from './technical-entry.controller';
import { AuthModule } from '@/auth/infrastructure/auth.module';
import { TagModule } from '@/tag/infrastructure/tag.module';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserPrismaRepository } from '@/user/infrastructure/database/prisma/repositories/user-prisma.repository';
import { TechnicalEntryPrismaRepository } from './database/prisma/repositories/technical-entry/technical-entry-prisma.repository';
import { TechnicalEntryTagPrismaRepository } from './database/prisma/repositories/tag-assignment/technical-entry-tag-prisma.repository';
import { CreateTechnicalEntryUseCase } from '../application/usecases/technical-entry/create-technical-entry.usecase';
import { GetTechnicalEntryUseCase } from '../application/usecases/technical-entry/get-technical-entry.usecase';
import { UpdateTechnicalEntryUseCase } from '../application/usecases/technical-entry/update-technical-entry.usecase';
import { DeleteTechnicalEntryUseCase } from '../application/usecases/technical-entry/delete-technical-entry.usecase';
import { TechnicalEntryRepository } from '../domain/repositories/technical-entry/technical-entry.repository';
import { SearchTechnicalEntryUseCase } from '../application/usecases/technical-entry/search-technical-entry.usecase';
import { AssignTagToTechnicalEntryUseCase } from '../application/usecases/tag-assignment/assign-tag-to-technical-entry.usecase';
import { RemoveTagFromTechnicalEntryUseCase } from '../application/usecases/tag-assignment/remove-tag-from-technical-entry.usecase';
import { TechnicalEntryTagRepository } from '../domain/repositories/tag-assignment/technical-entry-tag.repository';
import { TagRepository } from '@/tag/domain/repositories/tag.repository';
import { ProjectModule } from '@/project/infrastructure/project.module';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { SolutionAttemptPrismaRepository } from './database/prisma/repositories/solution-attempt/solution-attempt-prisma.repository';
import { SolutionAttemptRepository } from '../domain/repositories/solution-attempt/solution-attempt.repository';
import { AddSolutionAttemptUseCase } from '../application/usecases/solution-attempt/add-solution-attempt.usecase';
import { ListSolutionAttemptsUseCase } from '../application/usecases/solution-attempt/list-solution-attempts.usecase';
import { ResolveTechnicalIssueUseCase } from '../application/usecases/technical-entry/resolve-technical-issue.usecase';
import { ReopenTechnicalIssueUseCase } from '../application/usecases/technical-entry/reopen-technical-issue.usecase';
import { UpdateSolutionAttemptUseCase } from '../application/usecases/solution-attempt/update-solution-attempt.usecase';
import { RemoveSolutionAttemptUseCase } from '../application/usecases/solution-attempt/remove-solution-attempt.usecase';

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
      provide: 'SolutionAttemptRepository',
      useFactory: (prismaService: PrismaService) => {
        return new SolutionAttemptPrismaRepository(prismaService);
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
        projectRepository: ProjectRepository,
      ) => {
        return new SearchTechnicalEntryUseCase(
          technicalEntryRepository,
          technicalEntryTagRepository,
          projectRepository,
        );
      },
      inject: [
        'TechnicalEntryRepository',
        'TechnicalEntryTagRepository',
        'ProjectRepository',
      ],
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
    {
      provide: AddSolutionAttemptUseCase,
      useFactory: (
        technicalEntryRepository: TechnicalEntryRepository,
        solutionAttemptRepository: SolutionAttemptRepository,
      ) => {
        return new AddSolutionAttemptUseCase(
          technicalEntryRepository,
          solutionAttemptRepository,
        );
      },
      inject: ['TechnicalEntryRepository', 'SolutionAttemptRepository'],
    },
    {
      provide: UpdateSolutionAttemptUseCase,
      useFactory: (
        technicalEntryRepository: TechnicalEntryRepository,
        solutionAttemptRepository: SolutionAttemptRepository,
      ) => {
        return new UpdateSolutionAttemptUseCase(
          technicalEntryRepository,
          solutionAttemptRepository,
        );
      },
      inject: ['TechnicalEntryRepository', 'SolutionAttemptRepository'],
    },
    {
      provide: RemoveSolutionAttemptUseCase,
      useFactory: (
        technicalEntryRepository: TechnicalEntryRepository,
        solutionAttemptRepository: SolutionAttemptRepository,
      ) => {
        return new RemoveSolutionAttemptUseCase(
          technicalEntryRepository,
          solutionAttemptRepository,
        );
      },
      inject: ['TechnicalEntryRepository', 'SolutionAttemptRepository'],
    },
    {
      provide: ListSolutionAttemptsUseCase,
      useFactory: (
        solutionAttemptRepository: SolutionAttemptRepository,
        technicalEntryRepository: TechnicalEntryRepository,
      ) => {
        return new ListSolutionAttemptsUseCase(
          solutionAttemptRepository,
          technicalEntryRepository,
        );
      },
      inject: ['SolutionAttemptRepository', 'TechnicalEntryRepository'],
    },
    {
      provide: ResolveTechnicalIssueUseCase,
      useFactory: (technicalEntryRepository: TechnicalEntryRepository) => {
        return new ResolveTechnicalIssueUseCase(technicalEntryRepository);
      },
      inject: ['TechnicalEntryRepository'],
    },
    {
      provide: ReopenTechnicalIssueUseCase,
      useFactory: (technicalEntryRepository: TechnicalEntryRepository) => {
        return new ReopenTechnicalIssueUseCase(technicalEntryRepository);
      },
      inject: ['TechnicalEntryRepository'],
    },
  ],
})
export class TechnicalEntryModule {}
