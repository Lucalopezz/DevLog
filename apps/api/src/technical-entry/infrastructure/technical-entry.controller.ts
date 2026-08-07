import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { CreateTechnicalEntryDto } from './dto/create-technical-entry.dto';
import { UpdateTechnicalEntryDto } from './dto/update-technical-entry.dto';
import { CreateTechnicalEntryUseCase } from '../application/usecases/create-technical-entry.usecase';
import { AuthGuard } from '@/auth/infrastructure/auth.guard';
import { CurrentUser } from '@/auth/infrastructure/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/auth/types/authenticated-user';

@Controller('technical-entry')
export class TechnicalEntryController {
  @Inject(CreateTechnicalEntryUseCase)
  private createTechnicalEntryUseCase: CreateTechnicalEntryUseCase;

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body() createTechnicalEntryDto: CreateTechnicalEntryDto,
    @CurrentUser() userId: AuthenticatedUser,
  ) {
    const output = this.createTechnicalEntryUseCase.execute({
      ...createTechnicalEntryDto,
      userId: userId.id,
    });
    return output;
  }

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
