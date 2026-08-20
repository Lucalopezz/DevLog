import { IsString } from 'class-validator';
import { UpdateProjectDescriptionUseCaseInput } from '@/project/application/usecases/update-project-description.usecase';

export class UpdateProjectDescriptionDto implements Omit<
  UpdateProjectDescriptionUseCaseInput,
  'userId' | 'id'
> {
  @IsString({ message: 'Parametro inválido' })
  description: string;
}
