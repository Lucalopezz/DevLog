import { ProjectEntity, type ProjectProps } from '../project.entity';
import { ProjectStatusEnum } from '../project-status-enum';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';

function makeProps(overrides: Partial<ProjectProps> = {}): ProjectProps {
  const date = new Date('2026-08-01T00:00:00.000Z');

  return {
    userId: USER_ID,
    name: 'DevLog',
    description: 'Projeto de estudos',
    status: ProjectStatusEnum.ACTIVE,
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

describe('ProjectEntity', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('atualiza e limpa o caminho local pelo mesmo método', () => {
    const project = new ProjectEntity(makeProps());

    project.updatePath('/workspace/devlog');
    expect(project.localPath).toBe('/workspace/devlog');

    project.updatePath();
    expect(project.localPath).toBeUndefined();
  });

  it('arquiva e restaura o projeto mantendo status e data sincronizados', () => {
    jest.useFakeTimers();
    const archivedAt = new Date('2026-08-02T12:00:00.000Z');
    jest.setSystemTime(archivedAt);
    const project = new ProjectEntity(makeProps());

    project.toggleArchive();

    expect(project.status).toBe(ProjectStatusEnum.ACTIVE);
    expect(project.archivedAt).toEqual(archivedAt);
    expect(project.updatedAt).toEqual(archivedAt);

    const restoredAt = new Date('2026-08-03T12:00:00.000Z');
    jest.setSystemTime(restoredAt);
    project.toggleArchive();

    expect(project.status).toBe(ProjectStatusEnum.ACTIVE);
    expect(project.archivedAt).toBeUndefined();
    expect(project.updatedAt).toEqual(restoredAt);
  });

  it('atualiza nome, descrição, status e caminho sem arquivar', () => {
    const project = new ProjectEntity(makeProps());

    project.update({
      name: 'DevLog atualizado',
      description: 'Nova descrição',
      status: ProjectStatusEnum.FINISHED,
      localPath: '/workspace/devlog',
    });

    expect(project.name).toBe('DevLog atualizado');
    expect(project.description).toBe('Nova descrição');
    expect(project.status).toBe(ProjectStatusEnum.FINISHED);
    expect(project.localPath).toBe('/workspace/devlog');

    project.toggleArchive();
    project.update({ status: ProjectStatusEnum.ACTIVE });

    expect(project.archivedAt).toBeDefined();
    expect(project.status).toBe(ProjectStatusEnum.ACTIVE);
  });

  it('permite remover a descrição durante a atualização', () => {
    const project = new ProjectEntity(makeProps());

    project.updateDescription();

    expect(project.description).toBeUndefined();

    project.update({ description: 'Descrição restaurada' });

    expect(project.description).toBe('Descrição restaurada');
  });
});
