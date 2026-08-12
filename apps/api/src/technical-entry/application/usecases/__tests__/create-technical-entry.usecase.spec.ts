import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry.entity';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry.repository';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { CreateTechnicalEntryUseCase } from '../create-technical-entry.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';

describe('CreateTechnicalEntryUseCase', () => {
  function makeUseCase() {
    const technicalEntryRepository = {
      insert: jest.fn(),
    } as unknown as jest.Mocked<TechnicalEntryRepository>;
    const userRepository = {
      findById: jest.fn().mockResolvedValue({ id: USER_ID }),
    } as unknown as jest.Mocked<UserRepository>;

    return {
      useCase: new CreateTechnicalEntryUseCase(
        technicalEntryRepository,
        userRepository,
      ),
      technicalEntryRepository,
    };
  }

  it.each([undefined, null])(
    'cria uma entrada sem projeto quando projectId é %p',
    async (projectId) => {
      const { useCase, technicalEntryRepository } = makeUseCase();

      await useCase.execute({
        userId: USER_ID,
        title: 'Título da entrada',
        context: 'Contexto da entrada',
        type: TechnicalEntryType.ISSUE,
        projectId,
      });

      const [entry] = technicalEntryRepository.insert.mock.calls[0];

      expect(entry).toBeInstanceOf(TechnicalEntryEntity);
      expect(entry.projectId).toBeUndefined();
    },
  );

  it('preserva um projectId válido na criação', async () => {
    const { useCase, technicalEntryRepository } = makeUseCase();

    await useCase.execute({
      userId: USER_ID,
      title: 'Título da entrada',
      context: 'Contexto da entrada',
      type: TechnicalEntryType.ISSUE,
      projectId: PROJECT_ID,
    });

    const [entry] = technicalEntryRepository.insert.mock.calls[0];

    expect(entry.projectId).toBe(PROJECT_ID);
  });
});
