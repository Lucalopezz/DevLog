import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CreateTechnicalEntryDto } from './dto/create-technical-entry.dto';
import { UpdateTechnicalEntryDto } from './dto/update-technical-entry.dto';

@Controller('technical-entry')
export class TechnicalEntryController {
  @Post()
  create(@Body() createTechnicalEntryDto: CreateTechnicalEntryDto) {}

  @Get()
  findAll() {}

  @Get(':id')
  findOne(@Param('id') id: string) {}

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTechnicalEntryDto: UpdateTechnicalEntryDto,
  ) {}

  @Delete(':id')
  remove(@Param('id') id: string) {}
}
