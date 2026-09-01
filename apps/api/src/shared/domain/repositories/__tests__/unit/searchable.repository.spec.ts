import { Entity } from '../../../entities/entity';
import { SearchParams, SearchResult } from '../../searchable.repository';

class StubEntity extends Entity<{ name: string }> {}

describe('SearchParams', () => {
  it('normaliza paginação e filtro inválidos para valores padrão seguros', () => {
    const params = new SearchParams({
      page: Number.NaN,
      perPage: -1,
      sort: '',
      sortDir: 'desc',
      filter: '',
    });

    expect(params.page).toBe(1);
    expect(params.perPage).toBe(15);
    expect(params.sort).toBeNull();
    expect(params.sortDir).toBeNull();
    expect(params.filter).toBeNull();
  });

  it('mantém valores válidos de paginação, ordenação e filtro', () => {
    const params = new SearchParams({
      page: 2,
      perPage: 20,
      sort: 'name',
      sortDir: 'desc',
      filter: 42 as unknown as string,
    });

    expect(params).toMatchObject({
      page: 2,
      perPage: 20,
      sort: 'name',
      sortDir: 'desc',
      filter: '42',
    });
  });
});

describe('SearchResult', () => {
  it('calcula a última página e serializa entidades opcionalmente', () => {
    const item = new StubEntity({ name: 'Lucas' }, 'user-id');
    const result = new SearchResult({
      items: [item],
      total: 21,
      currentPage: 1,
      perPage: 20,
      sort: 'name',
      sortDir: 'asc',
      filter: 'luc',
    });

    expect(result.lastPage).toBe(2);
    expect(result.toJSON(true)).toEqual({
      items: [{ id: 'user-id', name: 'Lucas' }],
      total: 21,
      currentPage: 1,
      perPage: 20,
      lastPage: 2,
      sort: 'name',
      sortDir: 'asc',
      filter: 'luc',
    });
  });
});
