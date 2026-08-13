import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchTagDto } from './search-tag.dto';

describe('SearchTagDto', () => {
  it('converte e valida os parâmetros de busca', async () => {
    const dto = plainToInstance(SearchTagDto, {
      page: '2',
      perPage: '10',
      sort: 'name',
      sortDir: 'desc',
      name: 'NestJS',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.perPage).toBe(10);
  });

  it('rejeita parâmetros inválidos', async () => {
    const dto = plainToInstance(SearchTagDto, {
      page: '0',
      perPage: 'invalid',
      sort: 123,
      sortDir: 'up',
      name: 123,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['page', 'perPage', 'sort', 'sortDir', 'name']),
    );
  });
});
