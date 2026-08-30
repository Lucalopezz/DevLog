import { PartialType } from '@nestjs/swagger';
import { AddProjectCommandDto } from './add-project-command.dto';

export class UpdateProjectCommandDto extends PartialType(
  AddProjectCommandDto,
) {}
