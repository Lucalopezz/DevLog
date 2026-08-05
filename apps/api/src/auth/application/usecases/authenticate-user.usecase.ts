import type { HashProvider } from '@/shared/application/providers/hash-provaider';
import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import type { UserRepository } from '@/user/domain/repositories/user.repository';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { TokenProvider } from '../providers/token-provider';

export type AuthenticateUserInput = {
  email: string;
  password: string;
};

export type AuthenticateUserOutput = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

@Injectable()
export class AuthenticateUserUseCase implements UseCaseContract<
  AuthenticateUserInput,
  AuthenticateUserOutput
> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('HashProvider')
    private readonly hashProvider: HashProvider,
    @Inject('TokenProvider')
    private readonly tokenProvider: TokenProvider,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    const user = await this.userRepository.findByEmail(input.email);

    const passwordIsValid = user
      ? await this.hashProvider.compareHash(input.password, user.password)
      : false;

    if (!user || !passwordIsValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const accessToken = await this.tokenProvider.generate({
      sub: user.id,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
