import { RepositoryInterface } from '@/shared/domain/repositories/repository-contract';
import { ProjectTechnologyEntity } from '../../entities/technology/project-technology.entity';

export interface ProjectTechnologyRepository extends RepositoryInterface<ProjectTechnologyEntity> {
  findByProjectId(projectId: string): Promise<ProjectTechnologyEntity[]>;
  findByName(
    projectId: string,
    name: string,
  ): Promise<ProjectTechnologyEntity | null>;
}
