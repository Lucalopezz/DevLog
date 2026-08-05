import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { TokenProvider } from '../application/providers/token-provider';
import { ACCESS_TOKEN_COOKIE } from './constants/auth.constants';

type RequestWithUser = Request & {
  user?: { id: string };
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('TokenProvider')
    private readonly tokenProvider: TokenProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = request.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;

    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.tokenProvider.verify(token);

      if (!payload.sub) {
        throw new Error('Token sem subject');
      }

      // Adiciona o ID do usuário ao objeto de solicitação para uso posterior
      request.user = { id: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
