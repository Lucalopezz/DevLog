import {
  PaginationOutput,
  PaginationOutputMapper,
} from '@/shared/application/dtos/pagination-output';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
import {
  TechnicalEntryArchivedAtFilter,
  TechnicalEntryFilter,
  TechnicalEntryRepository,
  TechnicalEntrySearchParams,
  TechnicalEntrySearchResult,
} from '@/technical-entry/domain/repositories/technical-entry/technical-entry.repository';
import {
  TechnicalEntryOutput,
  TechnicalEntryOutputMapper,
} from '../../dto/technical-entry/technical-entry.dto';
import { TechnicalEntryStatus } from '@/technical-entry/domain/entities/technical-entry/technical-entry-status.enum';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TagEntity } from '@/tag/domain/entities/tag.entity';
import { TechnicalEntryTagRepository } from '@/technical-entry/domain/repositories/tag-assignment/technical-entry-tag.repository';
import { ProjectRepository } from '@/project/domain/repositories/project/project.repository';

export type SearchTechnicalEntryUseCaseInput = {
  userId: string;
  page?: number;
  perPage?: number;
  sort?: string;
  sortDir?: 'asc' | 'desc';
  // Filter
  projectId?: string;
  tagId?: string;
  title?: string;
  type?: TechnicalEntryType;
  archivedAt?: TechnicalEntryArchivedAtFilter;
  status?: TechnicalEntryStatus;
};

export type SearchTechnicalEntryUseCaseOutput =
  PaginationOutput<TechnicalEntryOutput>;

export class SearchTechnicalEntryUseCase implements UseCaseContract<
  SearchTechnicalEntryUseCaseInput,
  SearchTechnicalEntryUseCaseOutput
> {
  constructor(
    private readonly technicalEntryRepository: TechnicalEntryRepository,
    private readonly technicalEntryTagRepository: TechnicalEntryTagRepository,
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(
    input: SearchTechnicalEntryUseCaseInput,
  ): Promise<SearchTechnicalEntryUseCaseOutput> {
    // Check whether the entry type is LEARNING and a status was supplied
    // LEARNING entries have no status, so reject a status supplied for this type.
    // Throw an exception
    if (
      input.type === TechnicalEntryType.LEARNING &&
      input.status !== undefined
    ) {
      throw new UnprocessableEntityException(
        'LEARNING entries do not have a status',
      );
    }

    const filter: TechnicalEntryFilter = { userId: input.userId };

    if (input.projectId !== undefined) {
      const project = await this.projectRepository.findById(input.projectId);
      if (!project || project.userId !== input.userId) {
        throw new NotFoundException('Project not found');
      }
      filter.projectId = input.projectId;
    }

    if (input.tagId) filter.tagId = input.tagId;
    if (input.title) filter.title = input.title;
    if (input.type) filter.type = input.type;
    if (input.status) filter.status = input.status;

    // The default remains unarchived entries. The explicit `not-null` value
    // is used by the archived-entries page to request every archived entry.
    filter.archivedAt = input.archivedAt ?? null;

    const params = new TechnicalEntrySearchParams({
      page: input.page,
      perPage: input.perPage,
      sort: input.sort,
      sortDir: input.sortDir,
      filter,
    });

    const result = await this.technicalEntryRepository.search(params);
    // "entry-1" => [tag1, tag2]
    const tagsByEntry = await this.technicalEntryTagRepository.findTags({
      // Use the IDs of the retrieved technical entries to look up their associated tags
      technicalEntryIds: result.items.map((item) => item.id),
      userId: input.userId,
    });

    return this.toOutput(result, tagsByEntry);
  }

  private toOutput(
    result: TechnicalEntrySearchResult,
    tagsByEntry: Map<string, TagEntity[]>,
  ): SearchTechnicalEntryUseCaseOutput {
    const items = result.items.map((item) =>
      TechnicalEntryOutputMapper.toOutput(item, tagsByEntry.get(item.id) ?? []),
    );

    return PaginationOutputMapper.toOutout(items, result);
  }
}
