import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { HashProvider } from '@/shared/application/providers/hash-provaider';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { UserOutput, UserOutputMapper } from '../dto/user-output.dto';

export type UpdateUserPasswordUseCaseInput = {
  id: string;
  password: string;
  confirmPassword: string;
  currentPassword?: string;
};

export type UpdateUserPasswordUseCaseOutput = UserOutput;

export class UpdateUserPasswordUseCase implements UseCaseContract<
  UpdateUserPasswordUseCaseInput,
  UpdateUserPasswordUseCaseOutput
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashProvider: HashProvider,
  ) {}

  async execute(input: UpdateUserPasswordUseCaseInput): Promise<UserOutput> {
    const user = await this.userRepository.findById(input.id);

    if (user === null) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (input.password !== input.confirmPassword) {
      throw new ConflictException('As senhas não conferem');
    }

    if (input.currentPassword !== undefined) {
      const currentPasswordMatches = await this.hashProvider.compareHash(
        input.currentPassword,
        user.password,
      );

      if (!currentPasswordMatches) {
        throw new UnauthorizedException('Senha atual inválida');
      }
    }

    const passwordHash = await this.hashProvider.generateHash(input.password);
    user.updatePassword(passwordHash);

    await this.userRepository.update(user);

    return UserOutputMapper.toOutput(user);
  }
}
