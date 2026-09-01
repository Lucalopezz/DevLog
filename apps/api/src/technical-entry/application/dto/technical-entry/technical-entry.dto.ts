import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry/technical-entry-type.enum';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry/technical-entry.entity';
import { TagEntity } from '@/tag/domain/entities/tag.entity';
import { TagOutput, TagOutputMapper } from '@/tag/application/dto/tag.dto';

export type TechnicalEntryOutput = {
  id: string;
  projectId?: string;
  title: string;
  context: string;
  conclusion?: string;
  type: TechnicalEntryType;
  // Status infereido a partir do campo resolvedAt. Se resolvedAt for nulo, o status é 'OPEN', caso contrário, é 'RESOLVED'.
  status?: 'OPEN' | 'RESOLVED';
  resolvedAt?: Date;
  archivedAt?: Date;
  tags?: TagOutput[];
  createdAt: Date;
  updatedAt: Date;
};

export class TechnicalEntryOutputMapper {
  static toOutput(
    technicalEntry: TechnicalEntryEntity,
    tags?: TagEntity[],
  ): TechnicalEntryOutput {
    const output: TechnicalEntryOutput = {
      id: technicalEntry.id,
      projectId: technicalEntry.projectId,
      title: technicalEntry.title,
      context: technicalEntry.context,
      conclusion: technicalEntry.conclusion,
      type: technicalEntry.type,
      status: technicalEntry.status,
      resolvedAt: technicalEntry.resolvedAt,
      archivedAt: technicalEntry.archivedAt,
      createdAt: technicalEntry.createdAt,
      updatedAt: technicalEntry.updatedAt,
    };

    if (tags !== undefined) {
      output.tags = tags.map((tag) => TagOutputMapper.toOutput(tag));
    }

    return output;
  }
}
