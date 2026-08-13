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
import { CreateTagDto } from './dto/create-tag.dto';
import { CreateTagUseCase } from '../application/usecases/create-tag.usecase';
import { AuthGuard } from '@/auth/infrastructure/auth.guard';
import type { AuthenticatedUser } from '@/auth/types/authenticated-user';
import { CurrentUser } from '@/auth/infrastructure/decorators/current-user.decorator';

@Controller('tag')
@UseGuards(AuthGuard)
export class TagController {
  @Inject('CreateTagUseCase')
  private readonly createTagUseCase: CreateTagUseCase;

  @Post()
  create(
    @Body() createTagDto: CreateTagDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = this.createTagUseCase.execute({
      name: createTagDto.name,
      userId: user.id,
    });
    return output;
  }

  @Get()
  search() {}

  @Delete(':id')
  remove(@Param('id') id: string) {}
}
