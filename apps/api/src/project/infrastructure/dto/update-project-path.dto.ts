import { IsString } from 'class-validator';
import { UpdateProjectPathUseCaseInput } from '@/project/application/usecases/update-project-path.usecase';

export class UpdateProjectPathDto implements Omit<
  UpdateProjectPathUseCaseInput,
  'userId' | 'id'
> {
  @IsString({ message: 'Parametro inválido' })
  localPath: string;
}
