import { ProjectTechnologyEntity } from '@/project/domain/entities/technology/project-technology.entity';
import {
  ProjectTechnologyRepository,
  ProjectTechnologyOwnerSearch,
} from '@/project/domain/repositories/technology/project-technology.repository';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { Prisma } from '@generated/prisma/client';
import { ProjectTechnologyModelMapper } from './models/project-technology-model.mapper';

export class ProjectTechnologyPrismaRepository implements ProjectTechnologyRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async insert(entity: ProjectTechnologyEntity): Promise<void> {
    await this.prismaService.projectTechnology.create({
      data: ProjectTechnologyModelMapper.toPersistence(entity),
    });
  }

  async findAll(): Promise<ProjectTechnologyEntity[]> {
    const models = await this.prismaService.projectTechnology.findMany();
    return models.map((model) => ProjectTechnologyModelMapper.toEntity(model));
  }

  async findById(id: string): Promise<ProjectTechnologyEntity | null> {
    const model = await this.prismaService.projectTechnology.findUnique({
      where: { id },
    });

    return model ? ProjectTechnologyModelMapper.toEntity(model) : null;
  }

  async findByName(
    projectId: string,
    name: string,
  ): Promise<ProjectTechnologyEntity | null> {
    const model = await this.prismaService.projectTechnology.findUnique({
      where: {
        projectId_name: { projectId, name },
      },
    });

    return model ? ProjectTechnologyModelMapper.toEntity(model) : null;
  }

  async findByProjectId(projectId: string): Promise<ProjectTechnologyEntity[]> {
    const models = await this.prismaService.projectTechnology.findMany({
      where: { projectId },
    });

    return models.map((model) => ProjectTechnologyModelMapper.toEntity(model));
  }

  async searchForOwner(params: ProjectTechnologyOwnerSearch) {
    const where: Prisma.ProjectTechnologyWhereInput = {
      project: { is: { userId: params.userId } },
    };

    if (params.name) {
      where.name = { contains: params.name, mode: 'insensitive' };
    }
    if (params.projectId) {
      where.projectId = params.projectId;
    }

    const [total, models] = await Promise.all([
      this.prismaService.projectTechnology.count({ where }),
      this.prismaService.projectTechnology.findMany({
        where,
        include: { project: { select: { name: true } } },
        orderBy: [{ project: { name: 'asc' } }, { name: 'asc' }],
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
      }),
    ]);

    return {
      items: models.map((model) => ({
        id: model.id,
        projectId: model.projectId,
        projectName: model.project.name,
        name: model.name,
        version: model.version ?? undefined,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      })),
      total,
    };
  }

  async update(entity: ProjectTechnologyEntity): Promise<void> {
    await this.prismaService.projectTechnology.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        version: entity.version ?? null,
        updatedAt: entity.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.projectTechnology.delete({ where: { id } });
  }
}
