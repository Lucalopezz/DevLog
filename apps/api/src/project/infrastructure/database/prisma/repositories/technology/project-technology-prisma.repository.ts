import { ProjectTechnologyEntity } from '@/project/domain/entities/technology/project-technology.entity';
import { ProjectTechnologyRepository } from '@/project/domain/repositories/technology/project-technology.repository';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
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
