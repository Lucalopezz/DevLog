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
import { UpdateProjectDescriptionDto } from './dto/update-project-description.dto';
import { UpdateProjectPathDto } from './dto/update-project-path.dto';
import { UpdateProjectDescriptionUseCase } from '../application/usecases/update-project-description.usecase';
import { UpdateProjectPathUseCase } from '../application/usecases/update-project-path.usecase';
import { DeleteProjectUseCase } from '../application/usecases/delete-project.usecase';
import { ToggleProjectArchiveUseCase } from '../application/usecases/toggle-project-archive.usecase';
import type { ProjectOutput } from '../application/dto/project.dto';
import type { SearchProjectUseCaseOutput } from '../application/usecases/search-project.usecase';
import {
  ProjectCollectionPresenter,
  ProjectPresenter,
} from './presenter/project.presenter';

@UseGuards(AuthGuard)
@Controller('project')
export class ProjectController {
  @Inject(CreateProjectUseCase)
  private readonly createProjectUseCase: CreateProjectUseCase;

  @Inject(SearchProjectUseCase)
  private readonly searchProjectUseCase: SearchProjectUseCase;

  @Inject(GetProjectUseCase)
  private readonly getProjectUseCase: GetProjectUseCase;

  @Inject(UpdateProjectUseCase)
  private readonly updateProjectUseCase: UpdateProjectUseCase;

  @Inject(UpdateProjectDescriptionUseCase)
  private readonly updateProjectDescriptionUseCase: UpdateProjectDescriptionUseCase;

  @Inject(UpdateProjectPathUseCase)
  private readonly updateProjectPathUseCase: UpdateProjectPathUseCase;

  @Inject(DeleteProjectUseCase)
  private readonly deleteProjectUseCase: DeleteProjectUseCase;

  @Inject(ToggleProjectArchiveUseCase)
  private readonly toggleProjectArchiveUseCase: ToggleProjectArchiveUseCase;

  static projectToResponse(output: ProjectOutput) {
    return new ProjectPresenter(output);
  }

  static listProjectsToResponse(output: SearchProjectUseCaseOutput) {
    return new ProjectCollectionPresenter(output);
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

  @Patch(':id/description')
  async updateDescription(
    @Param('id') id: string,
    @Body() updateProjectDescriptionDto: UpdateProjectDescriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.updateProjectDescriptionUseCase.execute({
      ...updateProjectDescriptionDto,
      id,
      userId: user.id,
    });

    return ProjectController.projectToResponse(output);
  }

  @Patch(':id/local-path')
  async updatePath(
    @Param('id') id: string,
    @Body() updateProjectPathDto: UpdateProjectPathDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.updateProjectPathUseCase.execute({
      ...updateProjectPathDto,
      id,
      userId: user.id,
    });

    return ProjectController.projectToResponse(output);
  }

  @Patch(':id/archive')
  async toggleArchive(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.toggleProjectArchiveUseCase.execute({
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
}
