import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry/technical-entry.entity';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { CreateTechnicalEntryUseCase } from '../../create-technical-entry.usecase';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';
import { NotFoundException } from '@nestjs/common';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';

describe('CreateTechnicalEntryUseCase', () => {
  function makeUseCase(
    project: { userId: string; archivedAt?: Date } | null = {
      userId: USER_ID,
    },
  ) {
    const technicalEntryRepository = {
      insert: jest.fn(),
    } as unknown as jest.Mocked<TechnicalEntryRepository>;
    const projectRepository = {
      findById: jest.fn().mockResolvedValue(project),
    } as unknown as jest.Mocked<ProjectRepository>;
    const userRepository = {
      findById: jest.fn().mockResolvedValue({ id: USER_ID }),
    } as unknown as jest.Mocked<UserRepository>;

    return {
      useCase: new CreateTechnicalEntryUseCase(
        technicalEntryRepository,
        projectRepository,
        userRepository,
      ),
      technicalEntryRepository,
      projectRepository,
    };
  }

  it.each([undefined, null])(
    'creates an entry without a project when projectId is %p',
    async (projectId) => {
      const { useCase, technicalEntryRepository } = makeUseCase();

      await useCase.execute({
        userId: USER_ID,
        title: 'Entry title',
        context: 'Entry context',
        type: TechnicalEntryType.ISSUE,
        projectId,
      });

      const [entry] = technicalEntryRepository.insert.mock.calls[0];

      expect(entry).toBeInstanceOf(TechnicalEntryEntity);
      expect(entry.projectId).toBeUndefined();
    },
  );

  it('preserves a valid projectId on creation', async () => {
    const { useCase, technicalEntryRepository } = makeUseCase();

    await useCase.execute({
      userId: USER_ID,
      title: 'Entry title',
      context: 'Entry context',
      type: TechnicalEntryType.ISSUE,
      projectId: PROJECT_ID,
    });

    const [entry] = technicalEntryRepository.insert.mock.calls[0];

    expect(entry.projectId).toBe(PROJECT_ID);
  });

  it('does not query a project when projectId is omitted', async () => {
    const { useCase, projectRepository } = makeUseCase();

    await useCase.execute({
      userId: USER_ID,
      title: 'Entry title',
      context: 'Entry context',
      type: TechnicalEntryType.ISSUE,
    });

    expect(projectRepository.findById.mock.calls).toHaveLength(0);
  });

  it("rejects another user's project", async () => {
    const { useCase } = makeUseCase({ userId: OTHER_USER_ID });

    await expect(
      useCase.execute({
        userId: USER_ID,
        title: 'Entry title',
        context: 'Entry context',
        type: TechnicalEntryType.ISSUE,
        projectId: PROJECT_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an archived project', async () => {
    const { useCase } = makeUseCase({
      userId: USER_ID,
      archivedAt: new Date(),
    });

    await expect(
      useCase.execute({
        userId: USER_ID,
        title: 'Entry title',
        context: 'Entry context',
        type: TechnicalEntryType.ISSUE,
        projectId: PROJECT_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
