import { NotFoundException } from '@nestjs/common';
import { ProjectEntity } from '@/project/domain/entities/project.entity';
import { ProjectRepository } from '@/project/domain/repositories/project.repository';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { CreateProjectUseCase } from '../../create-project.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';

describe('CreateProjectUseCase', () => {
  function makeUseCase() {
    const insert = jest
      .fn<(entity: ProjectEntity) => Promise<void>>()
      .mockResolvedValue(undefined);
    const projectRepository = {
      insert,
    } as unknown as jest.Mocked<ProjectRepository>;
    const findById = jest.fn().mockResolvedValue({ id: USER_ID });
    const userRepository = {
      findById,
    } as unknown as jest.Mocked<UserRepository>;

    return {
      useCase: new CreateProjectUseCase(projectRepository, userRepository),
      projectRepository,
      insert,
      findById,
    };
  }

  it('cria um projeto ativo associado ao usuário autenticado', async () => {
    const { useCase, insert } = makeUseCase();

    const output = await useCase.execute({
      userId: USER_ID,
      name: 'DevLog',
      description: 'Projeto de estudos',
    });

    const [project] = insert.mock.calls[0] as [ProjectEntity];

    expect(project).toBeInstanceOf(ProjectEntity);
    expect(project.userId).toBe(USER_ID);
    expect(project.status).toBe('ACTIVE');
    expect(output).toMatchObject({
      id: project.id,
      name: 'DevLog',
      description: 'Projeto de estudos',
      status: 'ACTIVE',
    });
  });

  it('permite criar um projeto sem descrição', async () => {
    const { useCase, insert } = makeUseCase();

    await useCase.execute({
      userId: USER_ID,
      name: 'DevLog',
    });

    const [project] = insert.mock.calls[0] as [ProjectEntity];

    expect(project.description).toBeUndefined();
  });

  it('não cria o projeto quando o usuário não existe', async () => {
    const { useCase, insert, findById } = makeUseCase();
    findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: USER_ID, name: 'DevLog' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(insert).not.toHaveBeenCalled();
  });
});
