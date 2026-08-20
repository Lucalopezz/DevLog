import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateProjectDto extends OmitType(PartialType(CreateProjectDto), [
  'description',
] as const) {
  @IsOptional()
  @IsEnum(ProjectStatusEnum, { message: 'Parametro inválido' })
  status?: ProjectStatusEnum;
}
