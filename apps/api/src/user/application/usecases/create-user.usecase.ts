import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { UserOutput, UserOutputMapper } from '../dto/user-output.dto';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HashProvider } from '@/shared/application/providers/hash-provaider';
import { UserEntity } from '@/user/domain/entities/user.entity';

export type CreateUserUseCaseInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type CreateUserUseCaseOutput = UserOutput;

export class CreateUserUseCase implements UseCaseContract<
  CreateUserUseCaseInput,
  CreateUserUseCaseOutput
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashProvider: HashProvider,
  ) {}

  async execute(input: CreateUserUseCaseInput): Promise<UserOutput> {
    const { name, email, password, confirmPassword } = input;

    if (password !== confirmPassword) {
      throw new UnprocessableEntityException('As senhas não conferem');
    }

    const emailExists = await this.userRepository.findByEmail(email);

    if (emailExists !== null) {
      throw new ConflictException('E-mail já cadastrado');
    }
    const hashPass = await this.hashProvider.generateHash(password);

    const entity = new UserEntity({
      name,
      email,
      password: hashPass,
    });

    await this.userRepository.insert(entity);

    return UserOutputMapper.toOutput(entity);
  }
}
