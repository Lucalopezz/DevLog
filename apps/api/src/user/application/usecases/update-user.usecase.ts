import { NotFoundException } from '@nestjs/common';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { UserOutput, UserOutputMapper } from '../dto/user-output.dto';

export type UpdateUserUseCaseInput = {
  userId: string;
  name: string;
};

export type UpdateUserUseCaseOutput = UserOutput;

export class UpdateUserUseCase implements UseCaseContract<
  UpdateUserUseCaseInput,
  UpdateUserUseCaseOutput
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserUseCaseInput): Promise<UserOutput> {
    const user = await this.userRepository.findById(input.userId);

    if (user === null) {
      throw new NotFoundException('Usuário não encontrado');
    }

    user.updateName(input.name);

    await this.userRepository.update(user);

    return UserOutputMapper.toOutput(user);
  }
}
