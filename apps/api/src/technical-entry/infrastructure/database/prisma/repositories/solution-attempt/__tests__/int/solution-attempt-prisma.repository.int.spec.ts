import {
  clearIntegrationDatabase,
  createIntegrationPrisma,
} from '@/shared/infrastructure/database/__tests__/int/integration-test-helpers';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { SolutionAttemptEntity } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt.entity';
import { SolutionAttemptResult } from '@/technical-entry/domain/entities/solution-attempt/solution-attempt-result.enum';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry.entity';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { SolutionAttemptSearchParams } from '@/technical-entry/domain/repositories/solution-attempt/solution-attempt.repositoty';
import { TechnicalEntryPrismaRepository } from '@/technical-entry/infrastructure/database/prisma/repositories/technical-entry-prisma.repository';
import { UserEntity } from '@/user/domain/entities/user.entity';
import { UserPrismaRepository } from '@/user/infrastructure/database/prisma/repositories/user-prisma.repository';
import { SolutionAttemptPrismaRepository } from '../../solution-attempt-prisma.repository';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const ENTRY_ID = '123e4567-e89b-42d3-a456-426614174010';
const FAILED_ATTEMPT_ID = '123e4567-e89b-42d3-a456-426614174020';
const SUCCESS_ATTEMPT_ID = '123e4567-e89b-42d3-a456-426614174021';

describe('SolutionAttemptPrismaRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: SolutionAttemptPrismaRepository;

  beforeAll(async () => {
    prisma = createIntegrationPrisma();
    await prisma.$connect();
    repository = new SolutionAttemptPrismaRepository(prisma);
  });

  beforeEach(async () => {
    await clearIntegrationDatabase(prisma);
    await new UserPrismaRepository(prisma).insert(
      new UserEntity(
        {
          name: 'Attempt Owner',
          email: 'attempt-owner@example.com',
          password: 'hashed-password',
        },
        USER_ID,
      ),
    );
    await new TechnicalEntryPrismaRepository(prisma).insert(
      new TechnicalEntryEntity(
        {
          userId: USER_ID,
          title: 'Erro na API',
          context: 'Contexto do erro',
          type: TechnicalEntryType.ISSUE,
        },
        ENTRY_ID,
      ),
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('persiste, filtra, atualiza e remove tentativas vinculadas à entrada', async () => {
    const failed = new SolutionAttemptEntity(
      {
        technicalEntryId: ENTRY_ID,
        description: 'Primeira tentativa',
        result: SolutionAttemptResult.FAILED,
      },
      FAILED_ATTEMPT_ID,
    );
    const successful = new SolutionAttemptEntity(
      {
        technicalEntryId: ENTRY_ID,
        description: 'Segunda tentativa',
        result: SolutionAttemptResult.SUCCESSFUL,
      },
      SUCCESS_ATTEMPT_ID,
    );
    await repository.insert(failed);
    await repository.insert(successful);

    const result = await repository.search(
      new SolutionAttemptSearchParams({
        filter: {
          technicalEntryId: ENTRY_ID,
          result: SolutionAttemptResult.SUCCESSFUL,
        },
      }),
    );
    expect(result.items).toEqual([
      expect.objectContaining({ id: SUCCESS_ATTEMPT_ID }),
    ]);

    successful.updateDescription('Solução confirmada');
    await repository.update(successful);
    await expect(
      repository.findById(SUCCESS_ATTEMPT_ID),
    ).resolves.toMatchObject({
      description: 'Solução confirmada',
    });

    await repository.delete(FAILED_ATTEMPT_ID);
    await expect(repository.findById(FAILED_ATTEMPT_ID)).resolves.toBeNull();
  });
});
