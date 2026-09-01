import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProjectCommandDto } from '../../update-project-command.dto';

describe('UpdateProjectCommandDto', () => {
  it('aceita atualização parcial', async () => {
    const dto = plainToInstance(UpdateProjectCommandDto, {
      command: 'pnpm build',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('aceita null para remover descrição e ordem', async () => {
    const dto = plainToInstance(UpdateProjectCommandDto, {
      description: null,
      executionOrder: null,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejeita título nulo e ordem negativa', async () => {
    const dto = plainToInstance(UpdateProjectCommandDto, {
      title: null,
      executionOrder: -1,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['title', 'executionOrder']),
    );
  });
});
