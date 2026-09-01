import { ProjectEntity } from '@/project/domain/entities/project.entity';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { ValidationError } from '@/shared/domain/errors/validation-error';
import {
  Project,
  ProjectStatus as PrismaProjectStatus,
} from '@generated/prisma/client';
import { ProjectModelMapper } from '../../project-model.mapper';

const timestamp = new Date('2026-08-01T00:00:00.000Z');
const PROJECT_ID = '123e4567-e89b-42d3-a456-426614174010';
const USER_ID = '123e4567-e89b-42d3-a456-426614174000';

function makeModel(overrides: Partial<Project> = {}): Project {
  return {
    id: PROJECT_ID,
    userId: USER_ID,
    name: 'DevLog',
    description: null,
    status: PrismaProjectStatus.ACTIVE,
    localPath: null,
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

describe('ProjectModelMapper', () => {
  it.each([
    [PrismaProjectStatus.ACTIVE, ProjectStatusEnum.ACTIVE],
    [PrismaProjectStatus.PAUSED, ProjectStatusEnum.INACTIVE],
    [PrismaProjectStatus.FINISHED, ProjectStatusEnum.FINISHED],
  ])(
    'converte o status %s do Prisma para o domínio',
    (prismaStatus, domainStatus) => {
      const entity = ProjectModelMapper.toEntity(
        makeModel({ status: prismaStatus }),
      );

      expect(entity.status).toBe(domainStatus);
      expect(entity.description).toBeUndefined();
      expect(entity.localPath).toBeUndefined();
      expect(entity.archivedAt).toBeUndefined();
    },
  );

  it.each([
    [ProjectStatusEnum.ACTIVE, PrismaProjectStatus.ACTIVE],
    [ProjectStatusEnum.INACTIVE, PrismaProjectStatus.PAUSED],
    [ProjectStatusEnum.FINISHED, PrismaProjectStatus.FINISHED],
  ])(
    'converte o status %s do domínio para o Prisma',
    (domainStatus, prismaStatus) => {
      expect(ProjectModelMapper.toPrismaStatus(domainStatus)).toBe(
        prismaStatus,
      );
    },
  );

  it('converte entidade para persistência preservando opcionais', () => {
    const archivedAt = new Date('2026-08-02T00:00:00.000Z');
    const entity = new ProjectEntity(
      {
        userId: USER_ID,
        name: 'DevLog',
        description: 'Study project',
        status: ProjectStatusEnum.INACTIVE,
        localPath: '/workspace/devlog',
        archivedAt,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      PROJECT_ID,
    );

    expect(ProjectModelMapper.toPersistence(entity)).toEqual({
      id: PROJECT_ID,
      userId: USER_ID,
      name: 'DevLog',
      description: 'Study project',
      status: PrismaProjectStatus.PAUSED,
      localPath: '/workspace/devlog',
      archivedAt,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  it('rejeita status persistido ou de domínio desconhecido', () => {
    expect(() =>
      ProjectModelMapper.toEntity(
        makeModel({ status: 'UNKNOWN' as PrismaProjectStatus }),
      ),
    ).toThrow(ValidationError);
    expect(() =>
      ProjectModelMapper.toPrismaStatus('UNKNOWN' as ProjectStatusEnum),
    ).toThrow(ValidationError);
  });

  it('encapsula erro de validação ao hidratar uma entidade inválida', () => {
    expect(() => ProjectModelMapper.toEntity(makeModel({ name: '' }))).toThrow(
      ValidationError,
    );
  });
});
