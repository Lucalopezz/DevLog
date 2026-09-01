import { ProjectCommandEntity } from '@/project/domain/entities/command/project-command.entity';
import { ProjectEntity } from '@/project/domain/entities/project/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { ProjectCommandSearchParams } from '@/project/domain/repositories/command/project-command.repository';
import {
  clearIntegrationDatabase,
  createIntegrationPrisma,
} from '@/shared/infrastructure/database/__tests__/int/integration-test-helpers';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserEntity } from '@/user/domain/entities/user.entity';
import { UserPrismaRepository } from '@/user/infrastructure/database/prisma/repositories/user-prisma.repository';
import { ProjectCommandPrismaRepository } from '../../project-command-prisma.repository';
import { ProjectPrismaRepository } from '../../../project/project-prisma.repository';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';
const FIRST_COMMAND_ID = '123e4567-e89b-42d3-a456-426614174020';
const SECOND_COMMAND_ID = '123e4567-e89b-42d3-a456-426614174021';

describe('ProjectCommandPrismaRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: ProjectCommandPrismaRepository;

  beforeAll(async () => {
    prisma = createIntegrationPrisma();
    await prisma.$connect();
    repository = new ProjectCommandPrismaRepository(prisma);
  });

  beforeEach(async () => {
    await clearIntegrationDatabase(prisma);
    await new UserPrismaRepository(prisma).insert(
      new UserEntity(
        {
          name: 'Command Owner',
          email: 'command-owner@example.com',
          password: 'hashed-password',
        },
        USER_ID,
      ),
    );
    await new ProjectPrismaRepository(prisma).insert(
      new ProjectEntity(
        { userId: USER_ID, name: 'DevLog', status: ProjectStatusEnum.ACTIVE },
        PROJECT_ID,
      ),
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('persiste, ordena, filtra e atualiza comandos do projeto', async () => {
    const second = new ProjectCommandEntity(
      {
        projectId: PROJECT_ID,
        title: 'Run tests',
        command: 'pnpm test',
        description: 'Full test suite',
        executionOrder: 2,
      },
      SECOND_COMMAND_ID,
    );
    const first = new ProjectCommandEntity(
      {
        projectId: PROJECT_ID,
        title: 'Start API',
        command: 'pnpm dev',
        description: 'Development server',
        executionOrder: 1,
      },
      FIRST_COMMAND_ID,
    );
    await repository.insert(second);
    await repository.insert(first);

    const result = await repository.search(
      new ProjectCommandSearchParams({
        sort: 'executionOrder',
        sortDir: 'asc',
        filter: { projectId: PROJECT_ID, command: 'pnpm' },
      }),
    );

    expect(result.items.map((item) => item.id)).toEqual([
      FIRST_COMMAND_ID,
      SECOND_COMMAND_ID,
    ]);

    first.update({ description: null, executionOrder: 3 });
    await repository.update(first);
    await expect(repository.findById(FIRST_COMMAND_ID)).resolves.toMatchObject({
      description: undefined,
      executionOrder: 3,
    });
  });
});
