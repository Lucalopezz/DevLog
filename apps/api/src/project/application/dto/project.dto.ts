import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { ProjectEntity } from '@/project/domain/entities/project.entity';

export type ProjectOutput = {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatusEnum;
  localPath?: string;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class ProjectOutputMapper {
  static toOutput(project: ProjectEntity): ProjectOutput {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      localPath: project.localPath,
      archivedAt: project.archivedAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
