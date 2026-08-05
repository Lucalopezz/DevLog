import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserUseCase } from '../application/usecases/create-user.usecase';
import { UserOutput } from '../application/dto/user-output.dto';
import { UserPresenter } from './presenters/user.presenter';
import { GetCurrentUserUseCase } from '../application/usecases/get-current-user.usecase';
import { UpdateUserUseCase } from '../application/usecases/update-user.usecase';
import { UpdateUserPasswordUseCase } from '../application/usecases/update-user-password.usecase';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
  };
};

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
  async getCurrentUser(@Req() request: AuthenticatedRequest) {
    // TODO: Implementar autenticação e autorização para obter o usuário atual
    // const output = await this.getCurrentUserUseCase.execute({ id: userId });
    // return UserController.userToResponse(output);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const output = await this.updateUserUseCase.execute({
      id,
      name: updateUserDto.name,
    });
    return UserController.userToResponse(output);
  }

  @Patch(':id/password')
  async updatePassword(
    @Param('id') id: string,
    @Body() updateUserPasswordDto: UpdateUserPasswordDto,
  ) {
    const output = await this.updateUserPasswordUseCase.execute({
      id,
      ...updateUserPasswordDto,
    });
    return UserController.userToResponse(output);
  }
}
