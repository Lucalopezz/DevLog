import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { UserOutput, UserOutputMapper } from '../dto/user-output.dto';
import { NotFoundException } from '@nestjs/common';
import { UserRepository } from '@/user/domain/repositories/user.repository';

export type FindUserByEmailUseCaseInput = {
  email: string;
};

export type FindUserByEmailUseCaseOutput = UserOutput;

export class FindUserByEmailUseCase implements UseCaseContract<
  FindUserByEmailUseCaseInput,
  FindUserByEmailUseCaseOutput
> {
  constructor(private readonly userRepository: UserRepository) {}
  async execute(input: FindUserByEmailUseCaseInput): Promise<UserOutput> {
    const user = await this.userRepository.findByEmail(input.email);

    if (user === null) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return UserOutputMapper.toOutput(user);
  }
}
