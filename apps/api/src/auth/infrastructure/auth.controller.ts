import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Res,
} from '@nestjs/common';
import { AuthenticateUserUseCase } from '../application/usecases/authenticate-user.usecase';
import { AuthenticateUserDto } from '../application/dto/authenticate-user.input';
import { ACCESS_TOKEN_COOKIE } from './constants/auth.constants';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  @Inject(AuthenticateUserUseCase)
  private readonly authenticateUserUseCase: AuthenticateUserUseCase;

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() input: AuthenticateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authenticateUserUseCase.execute(input);

    response.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
      path: '/',
    });

    return result.user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}
