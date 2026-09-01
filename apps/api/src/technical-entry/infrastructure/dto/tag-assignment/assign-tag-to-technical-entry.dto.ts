import { AssignTagToTechnicalEntryInput } from '@/technical-entry/application/usecases/tag-assignment/assign-tag-to-technical-entry.usecase';
import { IsUUID } from 'class-validator';

export class AssignTagToTechnicalEntryDto implements Omit<
  AssignTagToTechnicalEntryInput,
  'technicalEntryId' | 'userId'
> {
  @IsUUID('4', { message: 'O ID da tag deve ser um UUID válido' })
  tagId: string;
}
