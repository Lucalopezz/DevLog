import { CollectionPresenter } from '@/shared/infrastructure/presenter/collection.presenter';
import { TagOutput } from '@/tag/application/dto/tag.dto';
import { SearchTagUseCaseOutput } from '@/tag/application/usecases/search-tag.usecase';

export class TagPresenter {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(output: TagOutput) {
    this.id = output.id;
    this.name = output.name;
    this.createdAt = output.createdAt;
    this.updatedAt = output.updatedAt;
  }
}

export class TagCollectionPresenter extends CollectionPresenter<TagPresenter> {
  data: TagPresenter[];

  constructor(output: SearchTagUseCaseOutput) {
    const { items, ...paginationProps } = output;
    super(paginationProps);
    this.data = items.map((item) => new TagPresenter(item));
  }
}
