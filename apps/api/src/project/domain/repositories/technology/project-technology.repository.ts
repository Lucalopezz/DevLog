import { RepositoryInterface } from '@/shared/domain/repositories/repository-contract';
import { ProjectTechnologyEntity } from '../../entities/technology/project-technology.entity';

export type ProjectTechnologyListItem = {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  version?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectTechnologyOwnerSearch = {
  userId: string;
  name?: string;
  projectId?: string;
  page: number;
  perPage: number;
};

export type ProjectTechnologyOwnerSearchResult = {
  items: ProjectTechnologyListItem[];
  total: number;
};

export interface ProjectTechnologyRepository extends RepositoryInterface<ProjectTechnologyEntity> {
  findByProjectId(projectId: string): Promise<ProjectTechnologyEntity[]>;
  searchForOwner(
    params: ProjectTechnologyOwnerSearch,
  ): Promise<ProjectTechnologyOwnerSearchResult>;
  findByName(
    projectId: string,
    name: string,
  ): Promise<ProjectTechnologyEntity | null>;
}
