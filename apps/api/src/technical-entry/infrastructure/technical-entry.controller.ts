import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CreateTechnicalEntryDto } from './dto/create-technical-entry.dto';
import { UpdateTechnicalEntryDto } from './dto/update-technical-entry.dto';
import { CreateTechnicalEntryUseCase } from '../application/usecases/create-technical-entry.usecase';
import { GetTechnicalEntryUseCase } from '../application/usecases/get-technical-entry.usecase';
import { UpdateTechnicalEntryUseCase } from '../application/usecases/update-technical-entry.usecase';
import { DeleteTechnicalEntryUseCase } from '../application/usecases/delete-technical-entry.usecase';
import { AuthGuard } from '@/auth/infrastructure/auth.guard';
import { CurrentUser } from '@/auth/infrastructure/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/auth/types/authenticated-user';
import {
  SearchTechnicalEntryUseCase,
  type SearchTechnicalEntryUseCaseOutput,
} from '../application/usecases/search-technical-entry.usecase';
import type { TechnicalEntryOutput } from '../application/dto/technical-entry.dto';
import {
  TechnicalEntryCollectionPresenter,
  TechnicalEntryPresenter,
} from './presenters/technical-entry.presenter';

@Controller('technical-entry')
export class TechnicalEntryController {
  @Inject(CreateTechnicalEntryUseCase)
  private createTechnicalEntryUseCase: CreateTechnicalEntryUseCase;

  @Inject(GetTechnicalEntryUseCase)
  private getTechnicalEntryUseCase: GetTechnicalEntryUseCase;

  @Inject(UpdateTechnicalEntryUseCase)
  private updateTechnicalEntryUseCase: UpdateTechnicalEntryUseCase;

  @Inject(DeleteTechnicalEntryUseCase)
  private deleteTechnicalEntryUseCase: DeleteTechnicalEntryUseCase;

  @Inject(SearchTechnicalEntryUseCase)
  private searchTechnicalEntryUseCase: SearchTechnicalEntryUseCase;

  static technicalEntryToResponse(output: TechnicalEntryOutput) {
    return new TechnicalEntryPresenter(output);
  }

  static listTechnicalEntriesToResponse(
    output: SearchTechnicalEntryUseCaseOutput,
  ) {
    return new TechnicalEntryCollectionPresenter(output);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() createTechnicalEntryDto: CreateTechnicalEntryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.createTechnicalEntryUseCase.execute({
      ...createTechnicalEntryDto,
      userId: user.id,
    });

    return TechnicalEntryController.technicalEntryToResponse(output);
  }

  @Get()
  @UseGuards(AuthGuard)
  async search(@CurrentUser() user: AuthenticatedUser) {
    const output = await this.searchTechnicalEntryUseCase.execute({
      userId: user.id,
    });

    return TechnicalEntryController.listTechnicalEntriesToResponse(output);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.getTechnicalEntryUseCase.execute({
      id,
      userId: user.id,
    });

    return TechnicalEntryController.technicalEntryToResponse(output);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateTechnicalEntryDto: UpdateTechnicalEntryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.updateTechnicalEntryUseCase.execute({
      ...updateTechnicalEntryDto,
      id,
      userId: user.id,
    });

    return TechnicalEntryController.technicalEntryToResponse(output);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.deleteTechnicalEntryUseCase.execute({
      id,
      userId: user.id,
    });
  }
}
