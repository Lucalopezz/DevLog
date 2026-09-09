import { AssignTagToTechnicalEntryInput } from '@/technical-entry/application/usecases/tag-assignment/assign-tag-to-technical-entry.usecase';
import { IsUUID } from 'class-validator';

export class AssignTagToTechnicalEntryDto implements Omit<
  AssignTagToTechnicalEntryInput,
  'technicalEntryId' | 'userId'
> {
  @IsUUID('4', { message: 'Tag ID must be a valid UUID' })
  tagId: string;
}
