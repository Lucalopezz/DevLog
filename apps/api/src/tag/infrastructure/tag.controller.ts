import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Inject,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { CreateTagUseCase } from '../application/usecases/create-tag.usecase';
import { AuthGuard } from '@/auth/infrastructure/auth.guard';
import type { AuthenticatedUser } from '@/auth/types/authenticated-user';
import { CurrentUser } from '@/auth/infrastructure/decorators/current-user.decorator';
import { SearchTagDto } from './dto/search-tag.dto';
import {
  SearchTagUseCase,
  SearchTagUseCaseOutput,
} from '../application/usecases/search-tag.usecase';
import { DeleteTagUseCase } from '../application/usecases/delete-tag.usecase';
import { TagOutput } from '../application/dto/tag.dto';
import {
  TagCollectionPresenter,
  TagPresenter,
} from './presenter/tag.presenter';

@Controller('tag')
@UseGuards(AuthGuard)
export class TagController {
  @Inject(CreateTagUseCase)
  private readonly createTagUseCase: CreateTagUseCase;

  @Inject(SearchTagUseCase)
  private readonly searchTagUseCase: SearchTagUseCase;

  @Inject(DeleteTagUseCase)
  private readonly deleteTagUseCase: DeleteTagUseCase;

  static tagToResponse(output: TagOutput) {
    return new TagPresenter(output);
  }

  static listTagsToResponse(output: SearchTagUseCaseOutput) {
    return new TagCollectionPresenter(output);
  }

  @Post()
  async create(
    @Body() createTagDto: CreateTagDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.createTagUseCase.execute({
      name: createTagDto.name,
      userId: user.id,
    });

    return TagController.tagToResponse(output);
  }

  @Get()
  async search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() searchParams: SearchTagDto,
  ) {
    const output = await this.searchTagUseCase.execute({
      ...searchParams,
      userId: user.id,
    });

    return TagController.listTagsToResponse(output);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.deleteTagUseCase.execute({
      id,
      userId: user.id,
    });
  }
}
