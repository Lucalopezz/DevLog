import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { SearchProjectDto } from './dto/search-project.dto';
import { AuthGuard } from '@/auth/infrastructure/auth.guard';
import { CurrentUser } from '@/auth/infrastructure/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/auth/types/authenticated-user';
import { CreateProjectUseCase } from '../application/usecases/create-project.usecase';
import { SearchProjectUseCase } from '../application/usecases/search-project.usecase';
import { GetProjectUseCase } from '../application/usecases/get-project.usecase';
import { UpdateProjectUseCase } from '../application/usecases/update-project.usecase';
import { DeleteProjectUseCase } from '../application/usecases/delete-project.usecase';
import { ArchiveProjectUseCase } from '../application/usecases/archive-project.usecase';
import { RestoreProjectUseCase } from '../application/usecases/restore-project.usecase';
import type { ProjectOutput } from '../application/dto/project.dto';
import type { SearchProjectUseCaseOutput } from '../application/usecases/search-project.usecase';
import {
  ProjectCollectionPresenter,
  ProjectPresenter,
} from './presenter/project.presenter';
import { SearchTechnicalEntryDto } from '@/technical-entry/infrastructure/dto/search-technical-entry.dto';
import { SearchTechnicalEntryUseCase } from '@/technical-entry/application/usecases/search-technical-entry.usecase';
import { TechnicalEntryCollectionPresenter } from '@/technical-entry/infrastructure/presenters/technical-entry.presenter';
import { AddProjectTechnologyDto } from './dto/add-project-technology.dto';
import { AddProjectTechnologyUseCase } from '../application/usecases/add-project-technology.usecase';
import { RemoveProjectTechnologyUseCase } from '../application/usecases/remove-project-technology.usecase';
import { AddProjectCommandDto } from './dto/add-project-command.dto';
import { AddProjectCommandUseCase } from '../application/usecases/add-project-command.usecase';
import {
  ProjectCommandCollectionPresenter,
  ProjectCommandPresenter,
} from './presenter/project-command.presenter';
import { UpdateProjectCommandDto } from './dto/update-project-command.dto';
import { UpdateProjectCommandUseCase } from '../application/usecases/update-project-command.usecase';
import { RemoveProjectCommandUseCase } from '../application/usecases/remove-project-command.usecase';
import { SearchProjectCommandDto } from './dto/search-project-command.dto';
import { SearchProjectCommandUseCase } from '../application/usecases/search-project-command.usecase';
import { GetProjectCommandUseCase } from '../application/usecases/get-project-command.usecase';
import type { ProjectCommandOutput } from '../application/dto/project-command.dto';
import type { SearchProjectCommandUseCaseOutput } from '../application/usecases/search-project-command.usecase';

@UseGuards(AuthGuard)
@Controller('project')
export class ProjectController {
  @Inject(CreateProjectUseCase)
  private readonly createProjectUseCase: CreateProjectUseCase;

  @Inject(SearchProjectUseCase)
  private readonly searchProjectUseCase: SearchProjectUseCase;

  @Inject(GetProjectUseCase)
  private readonly getProjectUseCase: GetProjectUseCase;

  @Inject(SearchTechnicalEntryUseCase)
  private readonly searchTechnicalEntryUseCase: SearchTechnicalEntryUseCase;

  @Inject(UpdateProjectUseCase)
  private readonly updateProjectUseCase: UpdateProjectUseCase;

  @Inject(DeleteProjectUseCase)
  private readonly deleteProjectUseCase: DeleteProjectUseCase;

  @Inject(ArchiveProjectUseCase)
  private readonly archiveProjectUseCase: ArchiveProjectUseCase;

  @Inject(RestoreProjectUseCase)
  private readonly restoreProjectUseCase: RestoreProjectUseCase;

  @Inject(AddProjectTechnologyUseCase)
  private readonly addProjectTechnologyUseCase: AddProjectTechnologyUseCase;

  @Inject(RemoveProjectTechnologyUseCase)
  private readonly removeProjectTechnologyUseCase: RemoveProjectTechnologyUseCase;

  @Inject(AddProjectCommandUseCase)
  private readonly addProjectCommandUseCase: AddProjectCommandUseCase;

  @Inject(UpdateProjectCommandUseCase)
  private readonly updateProjectCommandUseCase: UpdateProjectCommandUseCase;

  @Inject(RemoveProjectCommandUseCase)
  private readonly removeProjectCommandUseCase: RemoveProjectCommandUseCase;

  @Inject(SearchProjectCommandUseCase)
  private readonly searchProjectCommandUseCase: SearchProjectCommandUseCase;

  @Inject(GetProjectCommandUseCase)
  private readonly getProjectCommandUseCase: GetProjectCommandUseCase;

  static projectToResponse(output: ProjectOutput) {
    return new ProjectPresenter(output);
  }

  static listProjectsToResponse(output: SearchProjectUseCaseOutput) {
    return new ProjectCollectionPresenter(output);
  }

  static commandToResponse(output: ProjectCommandOutput) {
    return new ProjectCommandPresenter(output);
  }

  static listCommandsToResponse(output: SearchProjectCommandUseCaseOutput) {
    return new ProjectCommandCollectionPresenter(output);
  }

  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.createProjectUseCase.execute({
      ...createProjectDto,
      userId: user.id,
    });

    return ProjectController.projectToResponse(output);
  }

  @Get()
  async search(
    @Query() searchParams: SearchProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.searchProjectUseCase.execute({
      ...searchParams,
      userId: user.id,
    });

    return ProjectController.listProjectsToResponse(output);
  }

  @Get(':id/technical-entries')
  async searchTechnicalEntries(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() searchParams: SearchTechnicalEntryDto,
  ) {
    const output = await this.searchTechnicalEntryUseCase.execute({
      ...searchParams,
      projectId,
      userId: user.id,
    });

    return new TechnicalEntryCollectionPresenter(output);
  }

  @Get(':projectId/commands')
  async searchCommands(
    @Param('projectId') projectId: string,
    @Query() searchParams: SearchProjectCommandDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.searchProjectCommandUseCase.execute({
      ...searchParams,
      projectId,
      userId: user.id,
    });

    return ProjectController.listCommandsToResponse(output);
  }

  @Get(':projectId/commands/:commandId')
  async findCommand(
    @Param('projectId') projectId: string,
    @Param('commandId') commandId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.getProjectCommandUseCase.execute({
      projectId,
      commandId,
      userId: user.id,
    });

    return ProjectController.commandToResponse(output);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.getProjectUseCase.execute({
      id,
      userId: user.id,
    });

    return ProjectController.projectToResponse(output);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.updateProjectUseCase.execute({
      ...updateProjectDto,
      id,
      userId: user.id,
    });

    return ProjectController.projectToResponse(output);
  }

  @Patch(':id/archive')
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.archiveProjectUseCase.execute({
      id,
      userId: user.id,
    });

    return ProjectController.projectToResponse(output);
  }

  @Patch(':id/restore')
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.restoreProjectUseCase.execute({
      id,
      userId: user.id,
    });

    return ProjectController.projectToResponse(output);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.deleteProjectUseCase.execute({
      id,
      userId: user.id,
    });
  }

  @Post(':id/technologies')
  async addTechnology(
    @Param('id') projectId: string,
    @Body() addTechnologyDto: AddProjectTechnologyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.addProjectTechnologyUseCase.execute({
      ...addTechnologyDto,
      projectId,
      userId: user.id,
    });

    return ProjectController.projectToResponse(output);
  }

  @Delete(':id/technologies/:technologyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTechnology(
    @Param('id') projectId: string,
    @Param('technologyId') technologyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.removeProjectTechnologyUseCase.execute({
      projectId,
      technologyId,
      userId: user.id,
    });
  }

  @Post(':id/commands')
  async addCommand(
    @Param('id') projectId: string,
    @Body() addProjectCommandDto: AddProjectCommandDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.addProjectCommandUseCase.execute({
      ...addProjectCommandDto,
      projectId,
      userId: user.id,
    });

    return ProjectController.commandToResponse(output);
  }

  @Patch(':projectId/commands/:commandId')
  async updateCommand(
    @Param('projectId') projectId: string,
    @Param('commandId') commandId: string,
    @Body() updateProjectCommandDto: UpdateProjectCommandDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.updateProjectCommandUseCase.execute({
      ...updateProjectCommandDto,
      projectId,
      commandId,
      userId: user.id,
    });

    return ProjectController.commandToResponse(output);
  }

  @Delete(':projectId/commands/:commandId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCommand(
    @Param('projectId') projectId: string,
    @Param('commandId') commandId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.removeProjectCommandUseCase.execute({
      projectId,
      commandId,
      userId: user.id,
    });
  }
}
