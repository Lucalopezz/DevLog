import { ProjectStatusEnum } from '@/project/domain/entities/project/project-status-enum';
import type { UpdateProjectUseCaseInput } from '@/project/application/usecases/project/update-project.usecase';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProjectDto implements Omit<
  UpdateProjectUseCaseInput,
  'id' | 'userId'
> {
  // ValidateIf ignora somente campos ausentes. Diferente de IsOptional, ele não
  // ignora null, então campos não anuláveis continuam sendo validados.
  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString({ message: 'Parametro inválido' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
  @MaxLength(150, {
    message: 'O nome deve ter no máximo 150 caracteres',
  })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  description?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(ProjectStatusEnum, { message: 'Parametro inválido' })
  status?: ProjectStatusEnum;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  localPath?: string | null;
}
