import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectEnvironmentCategory } from '@/project/domain/entities/environment/project-environment-category.enum';
import { EntityValidationError } from '@/shared/domain/errors/entity-validation-error';
import { AddProjectEnvironmentUseCase } from '../../add-project-environment.usecase';

const userId = '123e4567-e89b-42d3-a456-426614174000';
const projectId = '123e4567-e89b-42d3-a456-426614174002';
function setup(ownerId = userId, archived = false) {
  const project = new ProjectEntity(
    {
      userId: ownerId,
      name: 'DevLog',
      status: ProjectStatusEnum.ACTIVE,
      archivedAt: archived ? new Date() : undefined,
    },
    projectId,
  );
  const projects = { findById: jest.fn().mockResolvedValue(project) };
  const environments = {
    findByNormalizedName: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockResolvedValue(undefined),
  };
  return {
    useCase: new AddProjectEnvironmentUseCase(
      projects as never,
      environments as never,
    ),
    environments,
  };
}

describe('AddProjectEnvironmentUseCase', () => {
  const input = {
    userId,
    projectId,
    name: ' Local Development ',
    category: ProjectEnvironmentCategory.LOCAL,
  };
  it('creates one owned environment with a normalized name', async () => {
    const { useCase, environments } = setup();
    const result = await useCase.execute(input);
    expect(environments.findByNormalizedName).toHaveBeenCalledWith(
      projectId,
      'local development',
    );
    expect(environments.insert).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      name: 'Local Development',
      projectName: 'DevLog',
    });
  });
  it('hides a foreign project', async () => {
    const { useCase, environments } = setup(
      '123e4567-e89b-42d3-a456-426614174001',
    );
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(environments.insert).not.toHaveBeenCalled();
  });
  it('rejects an archived project', async () => {
    const { useCase, environments } = setup(userId, true);
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      EntityValidationError,
    );
    expect(environments.insert).not.toHaveBeenCalled();
  });
  it('rejects duplicates', async () => {
    const { useCase, environments } = setup();
    environments.findByNormalizedName.mockResolvedValue({ id: 'existing' });
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(environments.insert).not.toHaveBeenCalled();
  });
});
