import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserPrismaRepository } from '@/user/infrastructure/database/prisma/repositories/user-prisma.repository';
import { ProjectPrismaRepository } from './database/prisma/project-prisma.repository';
import { CreateProjectUseCase } from '../application/usecases/create-project.usecase';
import { SearchProjectUseCase } from '../application/usecases/search-project.usecase';
import { GetProjectUseCase } from '../application/usecases/get-project.usecase';
import { UpdateProjectUseCase } from '../application/usecases/update-project.usecase';
import { DeleteProjectUseCase } from '../application/usecases/delete-project.usecase';
import { ArchiveProjectUseCase } from '../application/usecases/archive-project.usecase';
import { RestoreProjectUseCase } from '../application/usecases/restore-project.usecase';
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
import { UpdateProjectCommandUseCase } from '../application/usecases/update-project-command.usecase';
import { RemoveProjectCommandUseCase } from '../application/usecases/remove-project-command.usecase';
import { SearchProjectCommandUseCase } from '../application/usecases/search-project-command.usecase';
import { GetProjectCommandUseCase } from '../application/usecases/get-project-command.usecase';
import { ProjectResourceRepository } from '../domain/repositories/project-resource.repository';
import { ProjectResourcePrismaRepository } from './database/prisma/project-resource-prisma.repository';
import { AddProjectResourceUseCase } from '../application/usecases/add-project-resource.usecase';
import { UpdateProjectResourceUseCase } from '../application/usecases/update-project-resource.usecase';
import { RemoveProjectResourceUseCase } from '../application/usecases/remove-project-resource.usecase';
import { SearchProjectResourceUseCase } from '../application/usecases/search-project-resource.usecase';
import { GetProjectResourceUseCase } from '../application/usecases/get-project-resource.usecase';

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
      provide: 'ProjectResourceRepository',
      useFactory: (prismaService: PrismaService) => {
        return new ProjectResourcePrismaRepository(prismaService);
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
      provide: DeleteProjectUseCase,
      useFactory: (projectRepository: ProjectPrismaRepository) => {
        return new DeleteProjectUseCase(projectRepository);
      },
      inject: ['ProjectRepository'],
    },
    {
      provide: ArchiveProjectUseCase,
      useFactory: (projectRepository: ProjectPrismaRepository) => {
        return new ArchiveProjectUseCase(projectRepository);
      },
      inject: ['ProjectRepository'],
    },
    {
      provide: RestoreProjectUseCase,
      useFactory: (projectRepository: ProjectPrismaRepository) => {
        return new RestoreProjectUseCase(projectRepository);
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
    {
      provide: UpdateProjectCommandUseCase,
      useFactory: (
        projectRepository: ProjectRepository,
        projectCommandRepository: ProjectCommandRepository,
      ) => {
        return new UpdateProjectCommandUseCase(
          projectRepository,
          projectCommandRepository,
        );
      },
      inject: ['ProjectRepository', 'ProjectCommandRepository'],
    },
    {
      provide: RemoveProjectCommandUseCase,
      useFactory: (
        projectRepository: ProjectRepository,
        projectCommandRepository: ProjectCommandRepository,
      ) => {
        return new RemoveProjectCommandUseCase(
          projectRepository,
          projectCommandRepository,
        );
      },
      inject: ['ProjectRepository', 'ProjectCommandRepository'],
    },
    {
      provide: SearchProjectCommandUseCase,
      useFactory: (
        projectRepository: ProjectRepository,
        projectCommandRepository: ProjectCommandRepository,
      ) => {
        return new SearchProjectCommandUseCase(
          projectRepository,
          projectCommandRepository,
        );
      },
      inject: ['ProjectRepository', 'ProjectCommandRepository'],
    },
    {
      provide: GetProjectCommandUseCase,
      useFactory: (
        projectRepository: ProjectRepository,
        projectCommandRepository: ProjectCommandRepository,
      ) => {
        return new GetProjectCommandUseCase(
          projectRepository,
          projectCommandRepository,
        );
      },
      inject: ['ProjectRepository', 'ProjectCommandRepository'],
    },
    {
      provide: AddProjectResourceUseCase,
      useFactory: (
        projectRepository: ProjectRepository,
        projectResourceRepository: ProjectResourceRepository,
      ) => {
        return new AddProjectResourceUseCase(
          projectRepository,
          projectResourceRepository,
        );
      },
      inject: ['ProjectRepository', 'ProjectResourceRepository'],
    },
    {
      provide: UpdateProjectResourceUseCase,
      useFactory: (
        projectRepository: ProjectRepository,
        projectResourceRepository: ProjectResourceRepository,
      ) => {
        return new UpdateProjectResourceUseCase(
          projectRepository,
          projectResourceRepository,
        );
      },
      inject: ['ProjectRepository', 'ProjectResourceRepository'],
    },
    {
      provide: RemoveProjectResourceUseCase,
      useFactory: (
        projectRepository: ProjectRepository,
        projectResourceRepository: ProjectResourceRepository,
      ) => {
        return new RemoveProjectResourceUseCase(
          projectRepository,
          projectResourceRepository,
        );
      },
      inject: ['ProjectRepository', 'ProjectResourceRepository'],
    },
    {
      provide: SearchProjectResourceUseCase,
      useFactory: (
        projectRepository: ProjectRepository,
        projectResourceRepository: ProjectResourceRepository,
      ) => {
        return new SearchProjectResourceUseCase(
          projectRepository,
          projectResourceRepository,
        );
      },
      inject: ['ProjectRepository', 'ProjectResourceRepository'],
    },
    {
      provide: GetProjectResourceUseCase,
      useFactory: (
        projectRepository: ProjectRepository,
        projectResourceRepository: ProjectResourceRepository,
      ) => {
        return new GetProjectResourceUseCase(
          projectRepository,
          projectResourceRepository,
        );
      },
      inject: ['ProjectRepository', 'ProjectResourceRepository'],
    },
  ],
  exports: ['ProjectRepository'],
})
export class ProjectModule {}
