import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserPrismaRepository } from '@/user/infrastructure/database/prisma/repositories/user-prisma.repository';
import { ProjectPrismaRepository } from './database/prisma/project-prisma.repository';
import { CreateProjectUseCase } from '../application/usecases/create-project.usecase';
import { SearchProjectUseCase } from '../application/usecases/search-project.usecase';
import { GetProjectUseCase } from '../application/usecases/get-project.usecase';
import { UpdateProjectUseCase } from '../application/usecases/update-project.usecase';
import { UpdateProjectDescriptionUseCase } from '../application/usecases/update-project-description.usecase';
import { UpdateProjectPathUseCase } from '../application/usecases/update-project-path.usecase';
import { DeleteProjectUseCase } from '../application/usecases/delete-project.usecase';
import { ToggleProjectArchiveUseCase } from '../application/usecases/toggle-project-archive.usecase';
import { AuthModule } from '@/auth/infrastructure/auth.module';
import { SearchTechnicalEntryUseCase } from '@/technical-entry/application/usecases/search-technical-entry.usecase';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry.repository';
import { TechnicalEntryTagRepository } from '@/technical-entry/domain/repositories/technical-entry-tag.repository';
import { TechnicalEntryPrismaRepository } from '@/technical-entry/infrastructure/database/prisma/repositories/technical-entry-prisma.repository';
import { TechnicalEntryTagPrismaRepository } from '@/technical-entry/infrastructure/database/prisma/repositories/technical-entry-tag-prisma.repository';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { AddProjectTechnologyUseCase } from '../application/usecases/add-project-technology.usecase';
import { ProjectTechnologyRepository } from '../domain/repositories/project-technology.repository';
import { ProjectTechnologyPrismaRepository } from './database/prisma/project-technology-prisma.repository';
import { RemoveProjectTechnologyUseCase } from '../application/usecases/remove-project-technology.usecase';
import { ProjectCommandRepository } from '../domain/repositories/project-command.repository';
import { ProjectCommandPrismaRepository } from './database/prisma/project-command-prisma.repository';
import { AddProjectCommandUseCase } from '../application/usecases/add-project-command.usecase';

@Module({
  controllers: [ProjectController],
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
      provide: 'ProjectRepository',
      useFactory: (prismaService: PrismaService) => {
        return new ProjectPrismaRepository(prismaService);
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
      provide: 'ProjectTechnologyRepository',
      useFactory: (prismaService: PrismaService) => {
        return new ProjectTechnologyPrismaRepository(prismaService);
      },
      inject: ['PrismaService'],
    },
    {
      provide: 'ProjectCommandRepository',
      useFactory: (prismaService: PrismaService) => {
        return new ProjectCommandPrismaRepository(prismaService);
      },
      inject: ['PrismaService'],
    },
    {
      provide: CreateProjectUseCase,
      useFactory: (
        projectRepository: ProjectPrismaRepository,
        userRepository: UserPrismaRepository,
      ) => {
        return new CreateProjectUseCase(projectRepository, userRepository);
      },
      inject: ['ProjectRepository', 'UserRepository'],
    },
    {
      provide: SearchProjectUseCase,
      useFactory: (projectRepository: ProjectPrismaRepository) => {
        return new SearchProjectUseCase(projectRepository);
      },
      inject: ['ProjectRepository'],
    },
    {
      provide: GetProjectUseCase,
      useFactory: (projectRepository: ProjectPrismaRepository) => {
        return new GetProjectUseCase(projectRepository);
      },
      inject: ['ProjectRepository'],
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
      provide: UpdateProjectUseCase,
      useFactory: (projectRepository: ProjectPrismaRepository) => {
        return new UpdateProjectUseCase(projectRepository);
      },
      inject: ['ProjectRepository'],
    },
    {
      provide: UpdateProjectDescriptionUseCase,
      useFactory: (projectRepository: ProjectPrismaRepository) => {
        return new UpdateProjectDescriptionUseCase(projectRepository);
      },
      inject: ['ProjectRepository'],
    },
    {
      provide: UpdateProjectPathUseCase,
      useFactory: (projectRepository: ProjectPrismaRepository) => {
        return new UpdateProjectPathUseCase(projectRepository);
      },
      inject: ['ProjectRepository'],
    },
    {
      provide: DeleteProjectUseCase,
      useFactory: (projectRepository: ProjectPrismaRepository) => {
        return new DeleteProjectUseCase(projectRepository);
      },
      inject: ['ProjectRepository'],
    },
    {
      provide: ToggleProjectArchiveUseCase,
      useFactory: (projectRepository: ProjectPrismaRepository) => {
        return new ToggleProjectArchiveUseCase(projectRepository);
      },
      inject: ['ProjectRepository'],
    },
    {
      provide: AddProjectTechnologyUseCase,
      useFactory: (
        projectRepository: ProjectPrismaRepository,
        projectTechnologyRepository: ProjectTechnologyRepository,
      ) => {
        return new AddProjectTechnologyUseCase(
          projectRepository,
          projectTechnologyRepository,
        );
      },
      inject: ['ProjectRepository', 'ProjectTechnologyRepository'],
    },
    {
      provide: RemoveProjectTechnologyUseCase,
      useFactory: (
        projectRepository: ProjectPrismaRepository,
        projectTechnologyRepository: ProjectTechnologyRepository,
      ) => {
        return new RemoveProjectTechnologyUseCase(
          projectRepository,
          projectTechnologyRepository,
        );
      },
      inject: ['ProjectRepository', 'ProjectTechnologyRepository'],
    },
    {
      provide: AddProjectCommandUseCase,
      useFactory: (
        projectRepository: ProjectRepository,
        projectCommandRepository: ProjectCommandRepository,
      ) => {
        return new AddProjectCommandUseCase(
          projectRepository,
          projectCommandRepository,
        );
      },
      inject: ['ProjectRepository', 'ProjectCommandRepository'],
    },
  ],
  exports: ['ProjectRepository'],
})
export class ProjectModule {}
