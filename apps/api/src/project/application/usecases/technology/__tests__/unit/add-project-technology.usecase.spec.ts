import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectTechnologyEntity } from '@/project/domain/entities/technology/project-technology.entity';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { ProjectTechnologyRepository } from '@/project/domain/repositories/technology/project-technology.repository';
import { AddProjectTechnologyUseCase } from '../../add-project-technology.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';

function makeProject(userId = USER_ID): ProjectEntity {
  return new ProjectEntity(
    { userId, name: 'DevLog', status: ProjectStatusEnum.ACTIVE },
    PROJECT_ID,
  );
}

function makeUseCase(project: ProjectEntity | null = makeProject()) {
  const projectRepository = {
    findById: jest.fn().mockResolvedValue(project),
  } as unknown as jest.Mocked<ProjectRepository>;
  const projectTechnologyRepository = {
    findByName: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ProjectTechnologyRepository>;

  return {
    useCase: new AddProjectTechnologyUseCase(
      projectRepository,
      projectTechnologyRepository,
    ),
    projectTechnologyRepository,
  };
}

describe('AddProjectTechnologyUseCase', () => {
  it('adiciona e persiste uma tecnologia no projeto do usuário', async () => {
    const { useCase, projectTechnologyRepository } = makeUseCase();

    const output = await useCase.execute({
      userId: USER_ID,
      projectId: PROJECT_ID,
      name: 'NestJS',
      version: '11',
    });

    expect(projectTechnologyRepository.findByName.mock.calls).toEqual([
      [PROJECT_ID, 'NestJS'],
    ]);
    const inserted = projectTechnologyRepository.insert.mock.calls[0]?.[0];
    expect(inserted).toMatchObject({
      projectId: PROJECT_ID,
      name: 'NestJS',
      version: '11',
    });
    expect(output.technologies?.[0]).toMatchObject({
      id: inserted.id,
      name: 'NestJS',
      version: '11',
    });
  });

  it.each([
    ['projeto inexistente', null],
    ['projeto de outro usuário', makeProject(OTHER_USER_ID)],
  ])(
    'rejeita %s sem consultar ou persistir tecnologia',
    async (_case, project) => {
      const { useCase, projectTechnologyRepository } = makeUseCase(project);

      await expect(
        useCase.execute({
          userId: USER_ID,
          projectId: PROJECT_ID,
          name: 'NestJS',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(projectTechnologyRepository.findByName.mock.calls).toHaveLength(0);
      expect(projectTechnologyRepository.insert.mock.calls).toHaveLength(0);
    },
  );

  it('rejeita tecnologia duplicada sem persistir', async () => {
    const { useCase, projectTechnologyRepository } = makeUseCase();
    projectTechnologyRepository.findByName.mockResolvedValue(
      new ProjectTechnologyEntity({
        projectId: PROJECT_ID,
        name: 'NestJS',
      }),
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        projectId: PROJECT_ID,
        name: 'NestJS',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(projectTechnologyRepository.insert.mock.calls).toHaveLength(0);
  });
});
