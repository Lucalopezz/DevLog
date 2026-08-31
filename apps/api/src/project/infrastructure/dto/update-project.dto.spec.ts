import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { UpdateProjectDto } from './update-project.dto';

describe('UpdateProjectDto', () => {
  it('aceita os campos editáveis de forma parcial', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      description: 'Projeto de estudos',
      status: ProjectStatusEnum.FINISHED,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('aceita null para remover descrição e caminho local', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      description: null,
      localPath: null,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejeita nome e status inválidos', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      name: null,
      status: null,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['name', 'status']),
    );
  });
});
