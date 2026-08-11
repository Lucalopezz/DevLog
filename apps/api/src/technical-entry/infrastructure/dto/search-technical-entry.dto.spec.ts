import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { TechnicalEntryStatus } from '@/technical-entry/domain/entities/technical-entry-status.enum';
import { SearchTechnicalEntryDto } from './search-technical-entry.dto';

describe('SearchTechnicalEntryDto', () => {
  it('converte e valida os parâmetros de busca', async () => {
    const dto = plainToInstance(SearchTechnicalEntryDto, {
      page: '2',
      perPage: '10',
      sort: 'title',
      sortDir: 'desc',
      archivedAt: 'null',
      type: TechnicalEntryType.ISSUE,
      status: TechnicalEntryStatus.OPEN,
      projectId: '5ab0c050-5050-4d2b-b0a0-44247985de2b',
      title: 'NestJS',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.perPage).toBe(10);
    expect(dto.archivedAt).toBeNull();
  });

  it('rejeita parâmetros inválidos', async () => {
    const dto = plainToInstance(SearchTechnicalEntryDto, {
      page: '0',
      perPage: 'invalid',
      sortDir: 'up',
      archivedAt: 'invalid-date',
      type: 'INVALID',
      status: 'INVALID',
      projectId: 'invalid-id',
      title: 123,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining([
        'page',
        'perPage',
        'sortDir',
        'archivedAt',
        'type',
        'status',
        'projectId',
        'title',
      ]),
    );
  });
});
