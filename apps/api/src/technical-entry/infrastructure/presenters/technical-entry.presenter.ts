import { CollectionPresenter } from '@/shared/infrastructure/presenter/collection.presenter';
import type { TechnicalEntryOutput } from '@/technical-entry/application/dto/technical-entry.dto';
import type { SearchTechnicalEntryUseCaseOutput } from '@/technical-entry/application/usecases/search-technical-entry.usecase';
import type { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { TagPresenter } from '@/tag/infrastructure/presenter/tag.presenter';

export class TechnicalEntryPresenter {
  id: string;
  projectId?: string;
  title: string;
  context: string;
  conclusion?: string;
  type: TechnicalEntryType;
  status?: 'OPEN' | 'RESOLVED';
  resolvedAt?: Date;
  archivedAt?: Date;
  declare tags?: TagPresenter[];
  createdAt: Date;
  updatedAt: Date;

  constructor(output: TechnicalEntryOutput) {
    this.id = output.id;
    this.projectId = output.projectId;
    this.title = output.title;
    this.context = output.context;
    this.conclusion = output.conclusion;
    this.type = output.type;
    this.status = output.status;
    this.resolvedAt = output.resolvedAt;
    this.archivedAt = output.archivedAt;
    if (output.tags !== undefined) {
      this.tags = output.tags.map((tag) => {
        // O tipo já é validado pelo TechnicalEntryOutput.
        return new TagPresenter(tag);
      });
    }
    this.createdAt = output.createdAt;
    this.updatedAt = output.updatedAt;
  }
}

export class TechnicalEntryCollectionPresenter extends CollectionPresenter<TechnicalEntryPresenter> {
  data: TechnicalEntryPresenter[];

  constructor(output: SearchTechnicalEntryUseCaseOutput) {
    const { items, ...paginationProps } = output;
    super(paginationProps);
    this.data = items.map((item) => new TechnicalEntryPresenter(item));
  }
}
