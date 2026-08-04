import { NotFoundException } from '@nestjs/common';
import { UserOutput, UserOutputMapper } from '../dto/user-output.dto';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { UserRepository } from '@/user/domain/repositories/user.repository';

export type GetCurrentUserUseCaseInput = {
  id: string;
};

export type GetCurrentUserUseCaseOutput = UserOutput;

export class GetCurrentUserUseCase implements UseCaseContract<
  GetCurrentUserUseCaseInput,
  GetCurrentUserUseCaseOutput
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetCurrentUserUseCaseInput): Promise<UserOutput> {
    const user = await this.userRepository.findById(input.id);

    if (user === null) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return UserOutputMapper.toOutput(user);
  }
}
