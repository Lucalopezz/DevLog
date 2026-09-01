import { ProjectResourceType } from '@/project/domain/entities/resource/project-resource-type.enum';
import { ProjectResourceEntity } from '@/project/domain/entities/resource/project-resource.entity';

export type ProjectResourceOutput = {
  id: string;
  projectId: string;
  label: string;
  url: string;
  type: ProjectResourceType;
  createdAt: Date;
  updatedAt: Date;
};

export class ProjectResourceOutputMapper {
  static toOutput(
    projectResource: ProjectResourceEntity,
  ): ProjectResourceOutput {
    return {
      id: projectResource.id,
      projectId: projectResource.projectId,
      label: projectResource.label,
      url: projectResource.url,
      type: projectResource.type,
      createdAt: projectResource.createdAt,
      updatedAt: projectResource.updatedAt,
    };
  }
}
