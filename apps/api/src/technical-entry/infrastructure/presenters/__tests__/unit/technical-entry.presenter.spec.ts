import { instanceToPlain } from 'class-transformer';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import type { TechnicalEntryOutput } from '@/technical-entry/application/dto/technical-entry.dto';
import type { TagOutput } from '@/tag/application/dto/tag.dto';
import {
  TechnicalEntryCollectionPresenter,
  TechnicalEntryPresenter,
} from '../../technical-entry.presenter';

describe('TechnicalEntryPresenter', () => {
  const tag: TagOutput = {
    id: 'tag-id',
    name: 'NestJS',
    createdAt: new Date('2026-08-10T12:00:00.000Z'),
    updatedAt: new Date('2026-08-10T13:00:00.000Z'),
  };
  const technicalEntry: TechnicalEntryOutput = {
    id: 'technical-entry-id',
    projectId: 'project-id',
    title: 'NestJS presenters',
    context: 'Separating application output from the HTTP response',
    conclusion: 'Presenters define the API representation',
    type: TechnicalEntryType.LEARNING,
    tags: [tag],
    createdAt: new Date('2026-08-10T12:00:00.000Z'),
    updatedAt: new Date('2026-08-10T13:00:00.000Z'),
  };

  it('maps a use case output to the item representation', () => {
    const presenter = new TechnicalEntryPresenter(technicalEntry);

    expect(presenter).toEqual(technicalEntry);
  });

  it('maps paginated items to data and pagination to meta', () => {
    const presenter = new TechnicalEntryCollectionPresenter({
      items: [technicalEntry],
      currentPage: 2,
      perPage: 15,
      lastPage: 3,
      total: 31,
    });

    const response = instanceToPlain(presenter);

    expect(response).toMatchObject({
      data: [technicalEntry],
      meta: {
        currentPage: 2,
        perPage: 15,
        lastPage: 3,
        total: 31,
      },
    });
    expect(response).not.toHaveProperty('paginationPresenter');
    expect(presenter.data[0]).toBeInstanceOf(TechnicalEntryPresenter);
  });
});
