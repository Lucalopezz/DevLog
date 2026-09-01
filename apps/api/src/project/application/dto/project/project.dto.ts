import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectTechnologyEntity } from '@/project/domain/entities/technology/project-technology.entity';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';

export type ProjectTechnologyOutput = {
  id: string;
  name: string;
  version?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectOutput = {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatusEnum;
  technologies?: ProjectTechnologyOutput[];
  localPath?: string;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class ProjectOutputMapper {
  static toOutput(
    project: ProjectEntity,
    technologies?: ProjectTechnologyEntity[],
  ): ProjectOutput {
    const output: ProjectOutput = {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      localPath: project.localPath,
      archivedAt: project.archivedAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };

    if (technologies !== undefined) {
      output.technologies = technologies.map((technology) => ({
        id: technology.id,
        name: technology.name,
        version: technology.version,
        createdAt: technology.createdAt,
        updatedAt: technology.updatedAt,
      }));
    }

    return output;
  }
}
