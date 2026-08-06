import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserUseCase } from '../application/usecases/create-user.usecase';
import { UserOutput } from '../application/dto/user-output.dto';
import { UserPresenter } from './presenters/user.presenter';
import { GetCurrentUserUseCase } from '../application/usecases/get-current-user.usecase';
import { UpdateUserUseCase } from '../application/usecases/update-user.usecase';
import { UpdateUserPasswordUseCase } from '../application/usecases/update-user-password.usecase';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { AuthGuard } from '@/auth/infrastructure/auth.guard';
import { CurrentUser } from '@/auth/infrastructure/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/auth/types/authenticated-user';

@Controller('users')
export class UserController {
  @Inject(CreateUserUseCase)
  private createUserUseCase: CreateUserUseCase;

  @Inject(GetCurrentUserUseCase)
  private getCurrentUserUseCase: GetCurrentUserUseCase;

  @Inject(UpdateUserUseCase)
  private updateUserUseCase: UpdateUserUseCase;

  @Inject(UpdateUserPasswordUseCase)
  private updateUserPasswordUseCase: UpdateUserPasswordUseCase;

  static userToResponse(output: UserOutput) {
    return new UserPresenter(output);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const output = await this.createUserUseCase.execute(createUserDto);
    return UserController.userToResponse(output);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    const output = await this.getCurrentUserUseCase.execute({
      id: user.id,
    });

    return UserController.userToResponse(output);
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.updateUserUseCase.execute({
      userId: user.id,
      name: updateUserDto.name,
    });
    return UserController.userToResponse(output);
  }

  @UseGuards(AuthGuard)
  @Patch('me/password')
  async updatePassword(
    @Body() updateUserPasswordDto: UpdateUserPasswordDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const output = await this.updateUserPasswordUseCase.execute({
      userId: user.id,
      ...updateUserPasswordDto,
    });
    return UserController.userToResponse(output);
  }
}
