import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { UserOutput } from '../dto/user-output.dto';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { ConflictException } from '@nestjs/common';

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
  constructor(private readonly userRepository: UserRepository) {}

  execute(input: CreateUserUseCaseInput): UserOutput | Promise<UserOutput> {
    const { name, email, password, confirmPassword } = input;

    if (password !== confirmPassword) {
      throw new ConflictException('Passwords do not match');
    }
    const emailExists = this.userRepository.findByEmail(email);

    if (emailExists === null) {
      throw new ConflictException('Email already exists');
    }
    // TODO: password hashing and user creation logic here
  }
}
