# Practical API authentication plan

This document describes DevLog API authentication using:

- JWT as a credential;
- An HttpOnly cookie to transport and store the JWT in the browser;
- AuthGuard to protect endpoints;
- request.user to carry authenticated identity;
- Ownership authorization to prevent access to another user's data.

The goal is to implement a simple, complete flow first. Refresh tokens, persisted session revocation, and token rotation are documented as a second stage.

> This is an implementation plan. Apply and validate each phase before starting the next.

## 1. Architectural decision

Cookies and JWTs are not alternatives:

~~~text
JWT
  -> represents authenticated identity and has a signature/expiration

Cookie HttpOnly
  -> prevents frontend JavaScript from reading the JWT

AuthGuard
  -> extracts the JWT from the cookie and validates its signature

request.user
  -> carries the authenticated user to the controller/use case

Authorization
  -> checks whether this user can access the requested resource
~~~

The main flow is:

~~~text
POST /auth/login
  -> validates email and password
  -> generates a JWT with sub = user.id
  -> sends the JWT in an HttpOnly cookie

GET /users/me
  -> AuthGuard reads the cookie
  -> verifies the JWT
  -> puts { id } in request.user
  -> GetCurrentUserUseCase finds the user
~~~

The frontend must not receive the token in the response body or store it in localStorage or sessionStorage.

## 2. API state at the start of this plan

These pieces already existed:

- @nestjs/jwt in apps/api/package.json;
- cookie-parser and its types;
- HashProvider using bcryptjs;
- UserRepository.findByEmail();
- JWT_SECRET and JWT_EXPIRES_IN_SECONDS partially anticipated in EnvConfigService;
- GET /users/me, without complete authentication.

Pending items identified in that code:

- cookie-parser was installed but not registered in main.ts;
- CORS configuration was anticipated but not enabled with credentials;
- UserOutput still contained the password hash;
- getCurrentUser() used userId without declaring it;
- UserModule did not yet export the providers AuthModule needed;
- apps/api/.env.example did not document JWT and CORS.

## 3. Expected final structure

Keep the project's feature organization:

~~~text
apps/api/src/auth/
├── application/
│   ├── dto/
│   │   └── authenticate-user.input.ts
│   ├── providers/
│   │   └── token-provider.ts
│   └── usecases/
│       └── authenticate-user.usecase.ts
├── infrastructure/
│   ├── auth.controller.ts
│   ├── auth.guard.ts
│   ├── auth.module.ts
│   ├── constants/
│   │   └── auth.constants.ts
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   └── providers/
│       └── jwt-token.service.ts
└── types/
    └── authenticated-user.ts
~~~

### File responsibilities

| File | Responsibility |
| --- | --- |
| authenticate-user.usecase.ts | Find the user and compare passwords |
| token-provider.ts | Abstract contract for creating/verifying tokens |
| jwt-token.service.ts | Adapt JwtService to the application contract |
| auth.controller.ts | Receive login, create/clear cookies, and return HTTP responses |
| auth.guard.ts | Read the cookie, validate JWT, and populate request.user |
| current-user.decorator.ts | Access request.user without duplicated code |
| auth.module.ts | Register and connect providers |

The use case must not know Response, Request, Express, or cookies. Cookies are HTTP transport details; the use case only needs to know it must generate a token.

## 4. Phase 0 — prepare configuration and fix leaks

### 4.1 Update .env.example

Edit apps/api/.env.example and document:

~~~env
PORT=3000
NODE_ENV=development

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN_SECONDS=3600

CORS_ALLOWED_ORIGINS=http://localhost:5173
~~~

Generate a real secret locally with an appropriate generator. Do not use the example in production or commit the actual .env.

### 4.2 Fix the configuration name

Rename:

to:

~~~ts
getJwtExpiresInSeconds()
~~~

Also update EnvConfig and every consumer:

~~~ts
getJwtExpiresInSeconds(): number {
  return Number(
    this.configService.get<number>('JWT_EXPIRES_IN_SECONDS', 3600),
  );
}
~~~

### 4.3 Stop carrying passwords in public output

At this stage, UserOutput contained password even though UserPresenter hid it. Public output must not carry this field:

~~~ts
export type UserOutput = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};
~~~

Also update UserOutputMapper.toOutput() to omit password. The repository can still hydrate the entity with the hash for login, but the public mapper must not copy it.

The hash remains necessary internally for authentication, but must never leave the persistence/public application boundary.

### 4.4 Fix the me endpoint

Remove the undeclared userId from the controller. AuthGuard will provide it through request.user or CurrentUser.

Do not identify the current user through an ID supplied by the frontend. The trusted ID must come from the validated token.

### Phase 0 checkpoint

Execute:

~~~bash
pnpm --filter api format
pnpm --filter api lint
pnpm --filter api build
~~~

Continue only when configuration and the project compile again.

## 5. Phase 1 — create contracts and types

### 5.1 Authenticated user type

Create src/auth/types/authenticated-user.ts:

~~~ts
export type AuthenticatedUser = {
  id: string;
};
~~~

Initially, the JWT only needs the user ID. Do not put passwords, hashes, sensitive data, or large objects in the payload.

### 5.2 Token provider contract

Create src/auth/application/providers/token-provider.ts:

~~~ts
export type AccessTokenPayload = {
  sub: string;
};

export interface TokenProvider {
  generate(payload: AccessTokenPayload): Promise<string>;
  verify(token: string): Promise<AccessTokenPayload>;
}
~~~

The use case depends on this contract rather than directly on JwtService. This avoids tying the application to JWT if persisted sessions are adopted later.

### 5.3 Login DTO

Create src/auth/application/dto/authenticate-user.input.ts:

~~~ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthenticateUserDto {
  @IsEmail({}, { message: 'Invalid email' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
~~~

Login must return the same message for an unknown email and an incorrect password. This avoids revealing which emails are registered.

### 5.4 Cookie constant

Create src/auth/infrastructure/constants/auth.constants.ts:

~~~ts
export const ACCESS_TOKEN_COOKIE = 'devlog_access_token';
~~~

A constant prevents differences between login, guard, and logout.

## 6. Phase 2 — configure JWT and modules

### 6.1 Implement the JWT adapter

Create src/auth/infrastructure/providers/jwt-token.service.ts:

~~~ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AccessTokenPayload,
  TokenProvider,
} from '../../application/providers/token-provider';

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
~~~

Signing and verification use the same JwtModule configuration. JwtService also validates expiration.

### 6.2 Export UserModule dependencies

AuthModule must not create another repository or access Prisma directly. Make UserModule export the contracts used by the use case:

~~~ts
@Module({
  // Existing controllers and providers
  exports: ['UserRepository', 'HashProvider'],
})
export class UserModule {}
~~~

Keep the same tokens used in inject. A future alternative is exporting a FindUserByEmailUseCase from the user module.

### 6.3 Create AuthModule

Create src/auth/infrastructure/auth.module.ts:

~~~ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EnvConfigModule } from '@/shared/infrastructure/env-config/env-config.module';
import { EnvConfigService } from '@/shared/infrastructure/env-config/env-config.service';
import { UserModule } from '@/user/infrastructure/user.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { JwtTokenService } from './providers/jwt-token.service';
import { AuthenticateUserUseCase } from '../application/usecases/authenticate-user.usecase';

@Module({
  imports: [
    EnvConfigModule,
    UserModule,
    JwtModule.registerAsync({
      imports: [EnvConfigModule],
      inject: [EnvConfigService],
      useFactory: (envConfig: EnvConfigService) => ({
        secret: envConfig.getJwtSecret(),
        signOptions: {
          expiresIn: envConfig.getJwtExpiresInSeconds(),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtTokenService,
    {
      provide: 'TokenProvider',
      useExisting: JwtTokenService,
    },
    AuthenticateUserUseCase,
    AuthGuard,
  ],
  exports: [AuthGuard],
})
export class AuthModule {}
~~~

The TokenProvider token must match the use case inject token exactly. A constant may be used for this injection token.

### 6.4 Import AuthModule into the application

Update src/app.module.ts:

~~~ts
import { AuthModule } from './auth/infrastructure/auth.module';

@Module({
  imports: [
    EnvConfigModule,
    DatabaseModule,
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
~~~

After this phase, the application should start with JWT_SECRET configured, even before login is ready.

### Phase 2 checkpoint

Check:

~~~bash
pnpm --filter api build
pnpm --filter api test
~~~

If Nest reports a dependency error, first check exports and inject tokens. A provider not exported from UserModule is the most likely cause.

## 7. Phase 3 — implement the authentication use case

Create src/auth/application/usecases/authenticate-user.usecase.ts:

~~~ts
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { HashProvider } from '@/shared/application/providers/hash-provaider';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { TokenProvider } from '../providers/token-provider';

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
export class AuthenticateUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('HashProvider')
    private readonly hashProvider: HashProvider,
    @Inject('TokenProvider')
    private readonly tokenProvider: TokenProvider,
  ) {}

  async execute(
    input: AuthenticateUserInput,
  ): Promise<AuthenticateUserOutput> {
    const user = await this.userRepository.findByEmail(input.email);

    const passwordIsValid = user
      ? await this.hashProvider.compareHash(input.password, user.password)
      : false;

    if (!user || !passwordIsValid) {
      throw new UnauthorizedException('Invalid credentials');
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
~~~

The use case flow is:

1. Find the user by email;
2. Compare the supplied password with the hash;
3. Return a generic error if the user does not exist or the password fails;
4. Generate the token only after validation;
5. Return public data and the token to the controller;
6. Never return a password or hash to the client.

If the entity continues to call the hash password, document that it contains a hash rather than the original password. Renaming it to passwordHash is a possible future improvement.

## 8. Phase 4 — implement HTTP login and logout

### 8.1 Register cookies and CORS during bootstrap

Update src/main.ts:

~~~ts
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(cookieParser());

  app.enableCors({
    origin: (configService.get<string>('CORS_ALLOWED_ORIGINS') ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(configService.get<number>('PORT', 3000));
}
~~~

EnvConfigService may centralize port and CORS configuration. Never combine origin '*' with credentials true.

### 8.2 Create the controller

Create src/auth/infrastructure/auth.controller.ts:

~~~ts
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthenticateUserUseCase } from '../application/usecases/authenticate-user.usecase';
import { AuthenticateUserDto } from '../application/dto/authenticate-user.input';
import { ACCESS_TOKEN_COOKIE } from './constants/auth.constants';

@Controller('auth')
export class AuthController {
  @Inject(AuthenticateUserUseCase)
  private readonly authenticateUserUseCase: AuthenticateUserUseCase;

  @Post('login')
  @HttpCode(HttpStatus.OK)
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
~~~

Res passthrough lets the controller configure cookies without taking over the entire Nest response.

Use a shared function for cookie options when more endpoints create or clear cookies. clearCookie options must keep the same path and domain, when applicable.

### 8.3 Environment-specific configuration

Local development:

~~~text
httpOnly: true
secure: false
sameSite: 'lax'
~~~

Same-site HTTPS production:

~~~text
httpOnly: true
secure: true
sameSite: 'strict' or 'lax'
~~~

If the frontend and API are on different sites, the usual configuration is:

~~~text
sameSite: 'none'
secure: true
~~~

In that scenario, add CSRF protection before enabling write operations.

## 9. Phase 5 — implement the guard and decorator

### 9.1 Create the guard

Create src/auth/infrastructure/auth.guard.ts:

~~~ts
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenProvider } from '../application/providers/token-provider';
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
    const token = request.cookies?.[ACCESS_TOKEN_COOKIE];

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.tokenProvider.verify(token);

      if (!payload.sub) {
        throw new Error('Token without a subject');
      }

      request.user = { id: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
~~~

The guard handles authentication only. It must not decide whether a user can edit a specific project or entry.

### 9.2 Create the CurrentUser decorator

Create src/auth/infrastructure/decorators/current-user.decorator.ts:

~~~ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../types/authenticated-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
~~~

On a protected route, the guard must run before the controller.

## 10. Phase 6 — protect existing endpoints

In UserController:

~~~ts
@Post()
async create(@Body() createUserDto: CreateUserDto) {
  // Registration remains public
}

@UseGuards(AuthGuard)
@Get('me')
async getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
  const output = await this.getCurrentUserUseCase.execute({
    id: user.id,
  });

  return UserController.userToResponse(output);
}
~~~

Update routes must also require authentication:

~~~ts
@UseGuards(AuthGuard)
@Patch(':id')

@UseGuards(AuthGuard)
@Patch(':id/password')
~~~

Checking that a JWT exists is insufficient. The use case must ensure:

~~~ts
input.userId === input.resource.userId
~~~

For a user's own profile, derive the identifier from the authenticated user:

~~~ts
await updateUserUseCase.execute({
  id: currentUser.id,
  name: input.name,
});
~~~

This prevents the frontend from freely choosing which user to change.

In future project, entry, and tag modules:

~~~text
guard identifica userId
  -> controller passes userId to the use case
  -> use case queries the resource by id + userId
  -> another user's resource is treated as missing
~~~

Prefer queries combining resourceId and userId, such as findByIdAndUserId(resourceId, userId), instead of querying only by ID and remembering to check ownership afterward.

## 11. Phase 7 — integrate the frontend

The frontend does not need to read the cookie. It only needs to send credentials.

With fetch:

~~~ts
await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});
~~~

Then:

~~~ts
await fetch('http://localhost:3000/users/me', {
  credentials: 'include',
});
~~~

For Axios, configure withCredentials: true on the instance.

The frontend should treat 401 Unauthorized as unauthenticated and redirect to login. Do not try to retrieve the JWT from the cookie.

## 12. Phase 8 — CSRF and security rules

Because authentication relies on cookies:

- Do not change state through GET;
- Use SameSite=Lax or Strict when the architecture allows;
- Use Secure=true in production with HTTPS;
- Use explicit CORS origins;
- Never combine origin '*' with credentials true;
- Validate Origin or Referer for sensitive operations;
- For cross-site APIs, implement a CSRF token in a custom header;
- Do not log cookies or tokens;
- Do not put tokens in URLs, query strings, or JSON responses;
- Use a strong, different JWT secret for each environment.

For the local MVP, SameSite=Lax and explicit CORS are a starting point, but they are not universal substitutes for a CSRF strategy.

## 13. Phase 9 — unit tests

### AuthenticateUserUseCase

- An existing user with a correct password generates a token;
- An unknown email returns UnauthorizedException;
- An incorrect password returns UnauthorizedException;
- Unknown emails and incorrect passwords do not reveal which value failed;
- TokenProvider.generate() receives sub equal to the user ID;
- Output contains neither password nor hash.

### JwtTokenService

- Generates a token with the expected payload;
- Verifies a valid token;
- Rejects an invalid token;
- Rejects an expired token;

### AuthGuard

- Rejects a request without a cookie;
- Rejects an invalid cookie;
- Rejects a JWT without sub;
- Sets id in request.user when valid.

## 14. Phase 10 — end-to-end tests

Add a flow in apps/api/test using supertest:

~~~text
1. POST /users
2. POST /auth/login
3. Check status 200
4. Check Set-Cookie for HttpOnly
5. Use the cookie in GET /users/me
6. Verify that the correct user is returned
7. Call GET /users/me without a cookie and expect 401
8. POST /auth/logout
9. Verify that the cookie is cleared
~~~

Supertest can preserve cookies through an agent:

~~~ts
const agent = request.agent(app.getHttpServer());

await agent
  .post('/auth/login')
  .send({ email, password })
  .expect(200);

await agent.get('/users/me').expect(200);
~~~

Also test that a user cannot access or modify another user's project, entry, or profile.

## 15. Phase 11 — per-route or global guard

Start with explicit @UseGuards(AuthGuard) on protected routes. This makes authentication requirements visible.

When many endpoints are protected, consider a global guard. Login, registration, and other public routes must then be explicitly marked with metadata, such as @Public().

For the first implementation, a per-route guard is easier to test and understand.

## 16. Phase 12 — refresh tokens and sessions

The single-access-token MVP has this limitation:

~~~text
Logout clears the browser cookie
but an issued JWT remains valid until expiration
~~~

When this limitation matters:

~~~text
access token JWT: 10–15 minutos
Refresh token: random opaque value
refresh token: cookie HttpOnly
Refresh token hash: Session table in the database
Logout: revokes the session
Refresh: rotates the token
~~~

Do not store plaintext refresh tokens in the database. Store only a hash associated with:

~~~text
userId
tokenHash
expiresAt
revokedAt?
createdAt
~~~

This extension requires a migration and additional use cases:

- CreateSession;
- RefreshAccessToken;
- RevokeSession;
- LogoutUser.

Keep this separate from the first implementation. First make login, guard, me, logout, and tests work with a short-lived access token.

## 17. Recommended implementation order

1. Fix UserOutput so it does not carry a hash.
2. Fix JWT configuration and update .env.example.
3. Register cookie-parser, CORS, and credentials at bootstrap.
4. Create AuthenticatedUser, TokenProvider, and the cookie constant.
5. Export UserRepository and HashProvider from UserModule.
6. Create and register JwtTokenService.
7. Create AuthModule and import it into AppModule.
8. Implement AuthenticateUserUseCase.
9. Implement POST /auth/login and POST /auth/logout.
10. Implement AuthGuard and CurrentUser.
11. Protect GET /users/me.
12. Protect user updates and validate ownership.
13. Integrate credentials: 'include' in the frontend.
14. Create unit tests.
15. Create end-to-end tests.
16. Only then evaluate refresh tokens and persisted sessions.

## 18. Validation commands

Run from the root:

~~~bash
pnpm --filter api format
pnpm --filter api lint
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter api build
~~~

Valide manualmente:

~~~text
POST /auth/login with valid credentials -> 200 + Set-Cookie
POST /auth/login with invalid password  -> 401
GET  /users/me without a cookie                 -> 401
GET  /users/me with cookie              -> 200
POST /auth/logout                         -> cookie expirado
~~~

## 19. Completion criteria

The first version is complete when:

- Login validates email and password using the existing hash;
- JWT is signed with JWT_SECRET from the environment;
- JWT is sent only in an HttpOnly cookie;
- Secure is configured correctly for each environment;
- CORS accepts only configured origins and allows credentials;
- The guard rejects missing, invalid, or expired cookies;
- request.user.id comes exclusively from the validated JWT;
- GET /users/me works only when authenticated;
- Logout clears the cookie;
- No public response contains a password or hash;
- Future resources are queried with userId;
- Tests cover login, guard, me, logout, and unauthenticated access.

## 20. Topics to study during implementation

- Authentication versus authorization;
- Dependency inversion through interfaces and providers;
- The NestJS request lifecycle;
- The guard -> controller -> use case order;
- JWT signing, payload, and expiration;
- HttpOnly, Secure, and SameSite differences;
- CORS and browser credentials;
- Why cookies require CSRF consideration;
- Multiuser isolation through userId;
- Clearing a cookie versus revoking a server session.
