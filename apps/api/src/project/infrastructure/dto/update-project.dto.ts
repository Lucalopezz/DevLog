import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';
import { ProjectStatusEnum } from '@/project/domain/entities/project-status-enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsOptional()
  @IsEnum(ProjectStatusEnum, { message: 'Parametro inválido' })
  status?: ProjectStatusEnum;

  @IsOptional()
  @IsString({ message: 'Parametro inválido' })
  localPath?: string | null;
}
