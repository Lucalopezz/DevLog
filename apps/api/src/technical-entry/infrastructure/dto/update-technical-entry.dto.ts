import { PartialType } from '@nestjs/swagger';
import { CreateTechnicalEntryDto } from './create-technical-entry.dto';

export class UpdateTechnicalEntryDto extends PartialType(CreateTechnicalEntryDto) {}
