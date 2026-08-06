import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry.entity';

export type TechnicalEntryOutput = {
  id: string;
  userId: string;
  title: string;
  context: string;
  conclusion?: string;
  type: TechnicalEntryType;
  createdAt: Date;
  updatedAt: Date;
};

export class TechnicalEntryOutputMapper {
  static toOutput(technicalEntry: TechnicalEntryEntity): TechnicalEntryOutput {
    return {
      id: technicalEntry.id,
      userId: technicalEntry.userId,
      title: technicalEntry.title,
      context: technicalEntry.context,
      conclusion: technicalEntry.conclusion,
      type: technicalEntry.type,
      createdAt: technicalEntry.createdAt,
      updatedAt: technicalEntry.updatedAt,
    };
  }
}
