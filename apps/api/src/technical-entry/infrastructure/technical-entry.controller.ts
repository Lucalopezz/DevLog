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

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body() createTechnicalEntryDto: CreateTechnicalEntryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.createTechnicalEntryUseCase.execute({
      ...createTechnicalEntryDto,
      userId: user.id,
    });
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {}

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.getTechnicalEntryUseCase.execute({
      id,
      userId: user.id,
    });
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateTechnicalEntryDto: UpdateTechnicalEntryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateTechnicalEntryUseCase.execute({
      ...updateTechnicalEntryDto,
      id,
      userId: user.id,
    });
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
