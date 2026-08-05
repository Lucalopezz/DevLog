import {
  AccessTokenPayload,
  TokenProvider,
} from '@/auth/application/providers/token-provider';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtTokenService implements TokenProvider {
  constructor(private readonly jwtService: JwtService) {}

  generate(payload: AccessTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
  verify(token: string): Promise<AccessTokenPayload> {
    return this.jwtService.verifyAsync<AccessTokenPayload>(token);
  }
}
