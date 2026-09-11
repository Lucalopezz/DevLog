import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { CreateProjectUseCase } from '../../create-project.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';

describe('CreateProjectUseCase', () => {
  function makeUseCase() {
    const insert = jest
      .fn<(entity: ProjectEntity) => Promise<void>>()
      .mockResolvedValue(undefined);
    const findByNameAndOwnerId = jest.fn().mockResolvedValue(null);
    const projectRepository = {
      insert,
      findByNameAndOwnerId,
    } as unknown as jest.Mocked<ProjectRepository>;
    const findById = jest.fn().mockResolvedValue({ id: USER_ID });
    const userRepository = {
      findById,
    } as unknown as jest.Mocked<UserRepository>;

    return {
      useCase: new CreateProjectUseCase(projectRepository, userRepository),
      insert,
      findById,
      findByNameAndOwnerId,
    };
  }

  it('creates an active project associated with the authenticated user', async () => {
    const { useCase, insert } = makeUseCase();

    const output = await useCase.execute({
      userId: USER_ID,
      name: 'DevLog',
      description: 'Study project',
    });

    const [project] = insert.mock.calls[0] as [ProjectEntity];

    expect(project).toBeInstanceOf(ProjectEntity);
    expect(project.userId).toBe(USER_ID);
    expect(project.status).toBe('ACTIVE');
    expect(output).toMatchObject({
      id: project.id,
      name: 'DevLog',
      description: 'Study project',
      status: 'ACTIVE',
    });
  });

  it('allows creating a project without a description', async () => {
    const { useCase, insert } = makeUseCase();

    await useCase.execute({
      userId: USER_ID,
      name: 'DevLog',
    });

    const [project] = insert.mock.calls[0] as [ProjectEntity];

    expect(project.description).toBeUndefined();
  });

  it('does not create the project when the user does not exist', async () => {
    const { useCase, insert, findById } = makeUseCase();
    findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: USER_ID, name: 'DevLog' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(insert).not.toHaveBeenCalled();
  });

  it('rejects a project name already used by the same user', async () => {
    const { useCase, insert, findByNameAndOwnerId } = makeUseCase();
    findByNameAndOwnerId.mockResolvedValue(
      new ProjectEntity({
        userId: USER_ID,
        name: 'DevLog',
        status: 'ACTIVE',
      }),
    );
    const execution = useCase.execute({ userId: USER_ID, name: 'DevLog' });

    await expect(execution).rejects.toBeInstanceOf(ConflictException);
    await expect(execution).rejects.toThrow(
      'Project with this name already exists for this user',
    );

    expect(findByNameAndOwnerId).toHaveBeenCalledWith('DevLog', USER_ID);
    expect(insert).not.toHaveBeenCalled();
    expect(findByNameAndOwnerId).toHaveBeenCalledTimes(1);
  });
});
