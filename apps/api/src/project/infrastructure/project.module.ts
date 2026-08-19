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
import { AuthModule } from '@/auth/infrastructure/auth.module';

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
  ],
})
export class ProjectModule {}
