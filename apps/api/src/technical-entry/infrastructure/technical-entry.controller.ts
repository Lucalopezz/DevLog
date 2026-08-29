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
  Query,
} from '@nestjs/common';
import { CreateTechnicalEntryDto } from './dto/create-technical-entry.dto';
import { SearchTechnicalEntryDto } from './dto/search-technical-entry.dto';
import { UpdateTechnicalEntryDto } from './dto/update-technical-entry.dto';
import { CreateTechnicalEntryUseCase } from '../application/usecases/create-technical-entry.usecase';
import { GetTechnicalEntryUseCase } from '../application/usecases/get-technical-entry.usecase';
import { UpdateTechnicalEntryUseCase } from '../application/usecases/update-technical-entry.usecase';
import { DeleteTechnicalEntryUseCase } from '../application/usecases/delete-technical-entry.usecase';
import { AssignTagToTechnicalEntryUseCase } from '../application/usecases/assign-tag-to-technical-entry.usecase';
import { RemoveTagFromTechnicalEntryUseCase } from '../application/usecases/remove-tag-from-technical-entry.usecase';
import { AuthGuard } from '@/auth/infrastructure/auth.guard';
import { CurrentUser } from '@/auth/infrastructure/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/auth/types/authenticated-user';
import { AssignTagToTechnicalEntryDto } from './dto/assign-tag-to-technical-entry.dto';
import {
  SearchTechnicalEntryUseCase,
  type SearchTechnicalEntryUseCaseOutput,
} from '../application/usecases/search-technical-entry.usecase';
import type { TechnicalEntryOutput } from '../application/dto/technical-entry.dto';
import {
  TechnicalEntryCollectionPresenter,
  TechnicalEntryPresenter,
} from './presenters/technical-entry.presenter';
import { TagPresenter } from '@/tag/infrastructure/presenter/tag.presenter';
import { AddSolutionAttemptDto } from './dto/add-solution-attempt.dto';
import {
  AddSolutionAttemptUseCase,
  type AddSolutionAttemptUseCaseOutput,
} from '../application/usecases/add-solution-attempt.usecase';
import {
  SolutionAttemptCollectionPresenter,
  SolutionAttemptPresenter,
} from './presenters/solution-attempt.presenter';
import { ListSolutionAttemptsDto } from './dto/list-solution-attempts.dto';
import {
  ListSolutionAttemptsUseCase,
  type ListSolutionAttemptsUseCaseOutput,
} from '../application/usecases/list-solution-attempts.usecase';
import { ResolveTechnicalIssueDto } from './dto/resolve-technical-issue.dto';
import { ResolveTechnicalIssueUseCase } from '../application/usecases/resolve-technical-issue.usecase';
import { ReopenTechnicalIssueUseCase } from '../application/usecases/reopen-technical-issue.usecase';
import { UpdateSolutionAttemptUseCase } from '../application/usecases/update-solution-attempt.usecase';
import { UpdateSolutionAttemptDto } from './dto/update-solution-attempt.dto';
import { RemoveSolutionAttemptUseCase } from '../application/usecases/remove-solution-attempt.usecase';

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

  @Inject(AssignTagToTechnicalEntryUseCase)
  private assignTagToTechnicalEntryUseCase: AssignTagToTechnicalEntryUseCase;

  @Inject(RemoveTagFromTechnicalEntryUseCase)
  private removeTagFromTechnicalEntryUseCase: RemoveTagFromTechnicalEntryUseCase;

  @Inject(SearchTechnicalEntryUseCase)
  private searchTechnicalEntryUseCase: SearchTechnicalEntryUseCase;

  @Inject(AddSolutionAttemptUseCase)
  private addSolutionAttemptUseCase: AddSolutionAttemptUseCase;

  @Inject(UpdateSolutionAttemptUseCase)
  private updateSolutionAttemptUseCase: UpdateSolutionAttemptUseCase;

  @Inject(RemoveSolutionAttemptUseCase)
  private removeSolutionAttemptUseCase: RemoveSolutionAttemptUseCase;

  @Inject(ListSolutionAttemptsUseCase)
  private listSolutionAttemptsUseCase: ListSolutionAttemptsUseCase;

  @Inject(ResolveTechnicalIssueUseCase)
  private resolveTechnicalIssueUseCase: ResolveTechnicalIssueUseCase;

  @Inject(ReopenTechnicalIssueUseCase)
  private reopenTechnicalIssueUseCase: ReopenTechnicalIssueUseCase;

  static technicalEntryToResponse(output: TechnicalEntryOutput) {
    return new TechnicalEntryPresenter(output);
  }

  static listTechnicalEntriesToResponse(
    output: SearchTechnicalEntryUseCaseOutput,
  ) {
    return new TechnicalEntryCollectionPresenter(output);
  }

  static solutionAttemptToResponse(output: AddSolutionAttemptUseCaseOutput) {
    return new SolutionAttemptPresenter(output);
  }

  static listSolutionAttemptsToResponse(
    output: ListSolutionAttemptsUseCaseOutput,
  ) {
    return new SolutionAttemptCollectionPresenter(output);
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
  async search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() searchParams: SearchTechnicalEntryDto,
  ) {
    const output = await this.searchTechnicalEntryUseCase.execute({
      ...searchParams,
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

  @Patch(':id/resolve')
  @UseGuards(AuthGuard)
  async resolve(
    @Param('id') id: string,
    @Body() resolveTechnicalIssueDto: ResolveTechnicalIssueDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.resolveTechnicalIssueUseCase.execute({
      ...resolveTechnicalIssueDto,
      id,
      userId: user.id,
    });

    return TechnicalEntryController.technicalEntryToResponse(output);
  }

  @Patch(':id/reopen')
  @UseGuards(AuthGuard)
  async reopen(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.reopenTechnicalIssueUseCase.execute({
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

  @Post(':entryId/tags')
  @UseGuards(AuthGuard)
  async assignTag(
    @Param('entryId') entryId: string,
    @Body() assignTagDto: AssignTagToTechnicalEntryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.assignTagToTechnicalEntryUseCase.execute({
      technicalEntryId: entryId,
      tagId: assignTagDto.tagId,
      userId: user.id,
    });

    return new TagPresenter(output);
  }

  @Delete(':entryId/tags/:tagId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTag(
    @Param('entryId') entryId: string,
    @Param('tagId') tagId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.removeTagFromTechnicalEntryUseCase.execute({
      technicalEntryId: entryId,
      tagId,
      userId: user.id,
    });
  }

  @Post(':entryId/solution-attempts')
  @UseGuards(AuthGuard)
  async addSolutionAttempt(
    @Param('entryId') entryId: string,
    @Body() addSolutionAttemptDto: AddSolutionAttemptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.addSolutionAttemptUseCase.execute({
      ...addSolutionAttemptDto,
      technicalEntryId: entryId,
      userId: user.id,
    });

    return TechnicalEntryController.solutionAttemptToResponse(output);
  }

  @Patch(':entryId/solution-attempts/:attemptId')
  @UseGuards(AuthGuard)
  async updateSolutionAttempt(
    @Param('entryId') entryId: string,
    @Param('attemptId') attemptId: string,
    @Body() updateSolutionAttemptDto: UpdateSolutionAttemptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.updateSolutionAttemptUseCase.execute({
      ...updateSolutionAttemptDto,
      technicalEntryId: entryId,
      attemptId,
      userId: user.id,
    });

    return TechnicalEntryController.solutionAttemptToResponse(output);
  }

  @Delete(':entryId/solution-attempts/:attemptId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSolutionAttempt(
    @Param('entryId') entryId: string,
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.removeSolutionAttemptUseCase.execute({
      technicalEntryId: entryId,
      attemptId,
      userId: user.id,
    });
  }

  @Get(':entryId/solution-attempts')
  @UseGuards(AuthGuard)
  async listSolutionAttempts(
    @Param('entryId') entryId: string,
    @Query() listSolutionAttemptsDto: ListSolutionAttemptsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.listSolutionAttemptsUseCase.execute({
      ...listSolutionAttemptsDto,
      technicalEntryId: entryId,
      userId: user.id,
    });

    return TechnicalEntryController.listSolutionAttemptsToResponse(output);
  }
}
