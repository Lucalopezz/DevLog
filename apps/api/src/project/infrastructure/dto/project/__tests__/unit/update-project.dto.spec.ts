import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import { UpdateProjectDto } from '../../update-project.dto';

describe('UpdateProjectDto', () => {
  it('accepts editable fields partially', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      description: 'Study project',
      status: ProjectStatusEnum.FINISHED,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('accepts null to clear description and local path', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      description: null,
      localPath: null,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects invalid name and status', async () => {
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
