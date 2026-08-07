import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry.entity';

export type TechnicalEntryOutput = {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  context: string;
  conclusion?: string;
  type: TechnicalEntryType;
  status?: 'OPEN' | 'RESOLVED';
  resolvedAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class TechnicalEntryOutputMapper {
  static toOutput(technicalEntry: TechnicalEntryEntity): TechnicalEntryOutput {
    return {
      id: technicalEntry.id,
      userId: technicalEntry.userId,
      projectId: technicalEntry.projectId,
      title: technicalEntry.title,
      context: technicalEntry.context,
      conclusion: technicalEntry.conclusion,
      type: technicalEntry.type,
      ...(technicalEntry.type === TechnicalEntryType.ISSUE && {
        status: technicalEntry.resolvedAt ? 'RESOLVED' : 'OPEN',
      }),
      resolvedAt: technicalEntry.resolvedAt,
      archivedAt: technicalEntry.archivedAt,
      createdAt: technicalEntry.createdAt,
      updatedAt: technicalEntry.updatedAt,
    };
  }
}
