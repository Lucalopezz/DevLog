import { instanceToPlain } from 'class-transformer';
import { TagOutput } from '@/tag/application/dto/tag.dto';
import { TagCollectionPresenter, TagPresenter } from '../../tag.presenter';

describe('TagPresenter', () => {
  const tag: TagOutput = {
    id: 'tag-id',
    name: 'NestJS',
    createdAt: new Date('2026-08-10T12:00:00.000Z'),
    updatedAt: new Date('2026-08-10T13:00:00.000Z'),
  };

  it('maps use case output to the item representation', () => {
    expect(new TagPresenter(tag)).toEqual(tag);
  });

  it('maps paginated items to data and pagination to meta', () => {
    const presenter = new TagCollectionPresenter({
      items: [tag],
      currentPage: 2,
      perPage: 15,
      lastPage: 3,
      total: 31,
    });

    const response = instanceToPlain(presenter);

    expect(response).toMatchObject({
      data: [tag],
      meta: {
        currentPage: 2,
        perPage: 15,
        lastPage: 3,
        total: 31,
      },
    });
    expect(response).not.toHaveProperty('paginationPresenter');
    expect(presenter.data[0]).toBeInstanceOf(TagPresenter);
  });
});
