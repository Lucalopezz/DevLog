# Plano prático de autenticação da API

Este documento descreve a implementação da autenticação da API do DevLog usando:

- JWT como credencial;
- cookie HttpOnly para transportar e armazenar o JWT no navegador;
- AuthGuard para proteger endpoints;
- request.user para transportar a identidade autenticada;
- autorização por proprietário para impedir acesso aos dados de outro usuário.

O objetivo é implementar primeiro um fluxo simples e completo. Refresh tokens, revogação persistida de sessões e rotação de tokens ficam documentados como uma segunda etapa.

> Este é um plano de implementação. Aplique e valide cada fase antes de iniciar a próxima.

## 1. Decisão arquitetural

Cookie e JWT não são alternativas:

~~~text
JWT
  -> representa a identidade autenticada e possui assinatura/expiração

Cookie HttpOnly
  -> impede que o JavaScript do frontend leia o JWT

AuthGuard
  -> extrai o JWT do cookie e valida a assinatura

request.user
  -> transporta o usuário autenticado para o controller/caso de uso

Autorização
  -> verifica se esse usuário pode acessar o recurso solicitado
~~~

O fluxo principal será:

~~~text
POST /auth/login
  -> valida email e senha
  -> gera JWT com sub = user.id
  -> envia o JWT em cookie HttpOnly

GET /users/me
  -> AuthGuard lê o cookie
  -> verifica o JWT
  -> coloca { id } em request.user
  -> GetCurrentUserUseCase busca o usuário
~~~

O frontend não deve receber o token no corpo da resposta, nem armazená-lo em localStorage ou sessionStorage.

## 2. Estado atual da API

Estas peças já existem:

- @nestjs/jwt em apps/api/package.json;
- cookie-parser e seus tipos;
- HashProvider usando bcryptjs;
- UserRepository.findByEmail();
- JWT_SECRET e JWT_EXPIRES_IN_SECONDS parcialmente previstos em EnvConfigService;
- GET /users/me, ainda sem autenticação completa.

Pendências identificadas no código atual:

- cookie-parser está instalado, mas não é registrado em main.ts;
- CORS possui configuração prevista, mas não é habilitado com credenciais;
- UserOutput ainda contém o hash da senha;
- getCurrentUser() usa userId sem declará-lo;
- UserModule ainda não exporta os providers que AuthModule precisará usar;
- apps/api/.env.example não documenta JWT e CORS.

## 3. Estrutura final esperada

Mantenha a organização por feature usada pelo projeto:

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

### Responsabilidade de cada arquivo

| Arquivo | Responsabilidade |
| --- | --- |
| authenticate-user.usecase.ts | Buscar usuário e comparar senha |
| token-provider.ts | Contrato abstrato para criar/verificar tokens |
| jwt-token.service.ts | Adaptar JwtService ao contrato da aplicação |
| auth.controller.ts | Receber login, criar/remover cookie e retornar resposta HTTP |
| auth.guard.ts | Ler cookie, validar JWT e criar request.user |
| current-user.decorator.ts | Acessar request.user sem repetir código |
| auth.module.ts | Registrar e conectar os providers |

O caso de uso não deve conhecer Response, Request, Express ou cookies. Cookie é detalhe de transporte HTTP; o caso de uso deve saber apenas que precisa gerar um token.

## 4. Fase 0 — preparar configuração e corrigir vazamentos

### 4.1 Atualizar o .env.example

Edite apps/api/.env.example e documente:

~~~env
PORT=3000
NODE_ENV=development

JWT_SECRET=substitua-por-um-segredo-longo-e-aleatorio
JWT_EXPIRES_IN_SECONDS=3600

CORS_ALLOWED_ORIGINS=http://localhost:5173
~~~

Gere um segredo real localmente com um gerador apropriado. Não use o valor de exemplo em produção e não faça commit do .env real.

### 4.2 Corrigir o nome da configuração

Renomeie:

para:

~~~ts
getJwtExpiresInSeconds()
~~~

Atualize também EnvConfig e todos os consumidores:

~~~ts
getJwtExpiresInSeconds(): number {
  return Number(
    this.configService.get<number>('JWT_EXPIRES_IN_SECONDS', 3600),
  );
}
~~~

### 4.3 Parar de transportar senha no output público

Hoje UserOutput contém password, embora UserPresenter não o mostre. O output público não deve carregar esse campo:

~~~ts
export type UserOutput = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};
~~~

Atualize também UserOutputMapper.toOutput() para não incluir password no objeto retornado. O repositório ainda pode hidratar a entidade com o hash para o login, mas o mapper público não deve copiá-lo.

O hash continua necessário internamente para autenticar, mas nunca deve sair da camada de persistência/aplicação pública.

### 4.4 Corrigir o endpoint me

Remova o userId inexistente do controller. Ele será obtido pelo AuthGuard por meio de request.user ou do decorator CurrentUser.

Não resolva o usuário atual por um identificador enviado pelo frontend. O identificador confiável deve vir do token validado.

### Checkpoint da fase 0

Execute:

~~~bash
pnpm --filter api format
pnpm --filter api lint
pnpm --filter api build
~~~

Só avance quando a configuração e o projeto compilarem novamente.

## 5. Fase 1 — criar contratos e tipos

### 5.1 Tipo do usuário autenticado

Crie src/auth/types/authenticated-user.ts:

~~~ts
export type AuthenticatedUser = {
  id: string;
};
~~~

No primeiro momento, o JWT precisa carregar somente o identificador do usuário. Não coloque senha, hash, dados sensíveis ou objetos grandes no payload.

### 5.2 Contrato do provider de token

Crie src/auth/application/providers/token-provider.ts:

~~~ts
export type AccessTokenPayload = {
  sub: string;
};

export interface TokenProvider {
  generate(payload: AccessTokenPayload): Promise<string>;
  verify(token: string): Promise<AccessTokenPayload>;
}
~~~

O caso de uso depende desse contrato, e não diretamente de JwtService. Assim, a aplicação não fica presa ao JWT caso futuramente você queira usar sessão persistida.

### 5.3 DTO de login

Crie src/auth/application/dto/authenticate-user.input.ts:

~~~ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthenticateUserDto {
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'O email é obrigatório' })
  email: string;

  @IsString({ message: 'A senha deve ser um texto' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  password: string;
}
~~~

A regra de login deve retornar a mesma mensagem para email inexistente e senha incorreta. Isso evita revelar quais emails estão cadastrados.

### 5.4 Constante do cookie

Crie src/auth/infrastructure/constants/auth.constants.ts:

~~~ts
export const ACCESS_TOKEN_COOKIE = 'devlog_access_token';
~~~

Usar uma constante evita divergência entre login, guard e logout.

## 6. Fase 2 — configurar JWT e módulos

### 6.1 Implementar o adapter JWT

Crie src/auth/infrastructure/providers/jwt-token.service.ts:

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

A assinatura e a verificação usarão a mesma configuração do JwtModule. A expiração também será validada pelo JwtService.

### 6.2 Exportar dependências do UserModule

O AuthModule não deve criar outro repositório nem acessar Prisma diretamente. Faça o UserModule exportar os contratos utilizados pelo caso de uso:

~~~ts
@Module({
  // controllers e providers existentes
  exports: ['UserRepository', 'HashProvider'],
})
export class UserModule {}
~~~

Mantenha os mesmos tokens usados em inject. Uma alternativa futura é criar um FindUserByEmailUseCase no módulo de usuário e exportar esse caso de uso.

### 6.3 Criar o AuthModule

Crie src/auth/infrastructure/auth.module.ts:

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

O token TokenProvider precisa ser usado exatamente no inject do caso de uso. Se preferir, declare uma constante para esse injection token.

### 6.4 Importar o AuthModule na aplicação

Atualize src/app.module.ts:

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

Depois desta fase, a aplicação já deve iniciar com JWT_SECRET configurado, mesmo antes de o login estar pronto.

### Checkpoint da fase 2

Verifique:

~~~bash
pnpm --filter api build
pnpm --filter api test
~~~

Se aparecer erro de dependência no Nest, confira primeiro os tokens em exports e inject. A causa mais comum será um provider não exportado pelo UserModule.

## 7. Fase 3 — implementar o caso de uso de autenticação

Crie src/auth/application/usecases/authenticate-user.usecase.ts:

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
~~~

O fluxo do caso de uso é:

1. procurar o usuário por email;
2. comparar a senha recebida com o hash;
3. responder erro genérico se o usuário não existir ou a senha falhar;
4. gerar o token somente depois da validação;
5. retornar dados públicos e o token para o controller;
6. nunca retornar senha ou hash ao cliente.

Se a entidade continuar chamando o hash de password, documente que esse campo contém um hash, não a senha original. Uma melhoria futura seria renomeá-lo para passwordHash.

## 8. Fase 4 — implementar login e logout HTTP

### 8.1 Registrar cookies e CORS no bootstrap

Atualize src/main.ts:

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

Se preferir, use EnvConfigService para centralizar porta e CORS. O importante é não usar origin '*' junto com credentials true.

### 8.2 Criar o controller

Crie src/auth/infrastructure/auth.controller.ts:

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

O decorator Res passthrough permite configurar o cookie sem assumir o controle completo da resposta do Nest.

Use uma função compartilhada para montar as opções do cookie quando o projeto tiver mais endpoints que criem ou limpem cookies. As opções de clearCookie precisam manter o mesmo path e domain, quando houver.

### 8.3 Configuração por ambiente

Desenvolvimento local:

~~~text
httpOnly: true
secure: false
sameSite: 'lax'
~~~

Produção HTTPS no mesmo site:

~~~text
httpOnly: true
secure: true
sameSite: 'strict' ou 'lax'
~~~

Se frontend e API forem realmente sites diferentes, normalmente será necessário:

~~~text
sameSite: 'none'
secure: true
~~~

Nesse cenário, adicione proteção CSRF antes de liberar operações de escrita.

## 9. Fase 5 — implementar guard e decorator

### 9.1 Criar o guard

Crie src/auth/infrastructure/auth.guard.ts:

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
        throw new Error('Token sem subject');
      }

      request.user = { id: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
~~~

O guard deve fazer somente autenticação. Ele não deve decidir se o usuário pode editar determinado projeto ou entrada.

### 9.2 Criar o decorator CurrentUser

Crie src/auth/infrastructure/decorators/current-user.decorator.ts:

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

Em uma rota protegida, o guard deve ter sido executado antes do controller.

## 10. Fase 6 — proteger endpoints existentes

No UserController:

~~~ts
@Post()
async create(@Body() createUserDto: CreateUserDto) {
  // cadastro continua público
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

As rotas de atualização também devem exigir autenticação:

~~~ts
@UseGuards(AuthGuard)
@Patch(':id')

@UseGuards(AuthGuard)
@Patch(':id/password')
~~~

Não basta verificar que existe um JWT. O caso de uso precisa garantir que:

~~~ts
input.userId === input.resource.userId
~~~

Para o próprio perfil, prefira usar o usuário autenticado como origem do identificador:

~~~ts
await updateUserUseCase.execute({
  id: currentUser.id,
  name: input.name,
});
~~~

Assim o frontend não escolhe livremente qual usuário será alterado.

Nos futuros módulos de projetos, entradas e tags:

~~~text
guard identifica userId
  -> controller passa userId ao caso de uso
  -> caso de uso consulta recurso por id + userId
  -> recurso de outro usuário é tratado como inexistente
~~~

Prefira consultas com resourceId e userId juntos, como findByIdAndUserId(resourceId, userId), em vez de buscar apenas por ID e lembrar de verificar ownership depois.

## 11. Fase 7 — integrar o frontend

O frontend não precisa ler o cookie. Ele apenas precisa enviar credenciais.

Com fetch:

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

Depois:

~~~ts
await fetch('http://localhost:3000/users/me', {
  credentials: 'include',
});
~~~

Se usar Axios, configure withCredentials: true na instância.

O frontend deve tratar 401 Unauthorized como usuário não autenticado e redirecionar para login. Não tente recuperar o JWT do cookie.

## 12. Fase 8 — CSRF e regras de segurança

Como a autenticação depende de cookie:

- não altere estado com GET;
- use SameSite=Lax ou Strict quando a arquitetura permitir;
- use Secure=true em produção com HTTPS;
- use origens CORS explícitas;
- nunca use origin '*' com credentials true;
- valide Origin ou Referer em operações sensíveis;
- se a API for cross-site, implemente token CSRF em header customizado;
- não registre cookies ou tokens nos logs;
- não coloque token em URL, query string ou resposta JSON;
- use um segredo JWT forte e diferente por ambiente.

Para o MVP local, SameSite=Lax e CORS explícito são suficientes para começar, mas não devem ser tratados como substitutos universais de uma estratégia CSRF.

## 13. Fase 9 — testes unitários

### AuthenticateUserUseCase

- usuário existente e senha correta gera token;
- email inexistente retorna UnauthorizedException;
- senha incorreta retorna UnauthorizedException;
- email inexistente e senha incorreta não revelam qual dado falhou;
- TokenProvider.generate() recebe sub igual ao id do usuário;
- output não contém senha nem hash.

### JwtTokenService

- gera token com payload esperado;
- verifica token válido;
- rejeita token inválido;
- rejeita token expirado.

### AuthGuard

- rejeita request sem cookie;
- rejeita cookie inválido;
- rejeita JWT sem sub;
- coloca id em request.user quando válido.

## 14. Fase 10 — testes end-to-end

Adicione um fluxo em apps/api/test usando supertest:

~~~text
1. POST /users
2. POST /auth/login
3. verificar status 200
4. verificar Set-Cookie com HttpOnly
5. usar o cookie no GET /users/me
6. verificar que o usuário correto foi retornado
7. chamar GET /users/me sem cookie e esperar 401
8. POST /auth/logout
9. verificar que o cookie foi limpo
~~~

O supertest pode preservar cookies usando um agent:

~~~ts
const agent = request.agent(app.getHttpServer());

await agent
  .post('/auth/login')
  .send({ email, password })
  .expect(200);

await agent.get('/users/me').expect(200);
~~~

Também teste que um usuário não consegue acessar ou modificar projeto, entrada ou perfil pertencente a outro usuário.

## 15. Fase 11 — guard por rota ou global

Comece usando @UseGuards(AuthGuard) explicitamente nas rotas protegidas. Isso deixa claro quais endpoints exigem autenticação.

Quando a API tiver muitos endpoints protegidos, avalie um guard global. Nesse caso, será necessário marcar explicitamente login, cadastro e outras rotas públicas com metadata, por exemplo @Public().

Para a primeira implementação, o guard por rota é mais fácil de testar e compreender.

## 16. Fase 12 — evolução para refresh token e sessões

O MVP com um único access token possui esta limitação:

~~~text
logout remove o cookie do navegador
mas um JWT já emitido continua válido até expirar
~~~

Quando essa limitação for relevante:

~~~text
access token JWT: 10–15 minutos
refresh token: valor aleatório e opaco
refresh token: cookie HttpOnly
hash do refresh token: tabela Session no banco
logout: revoga a sessão
refresh: rotaciona o token
~~~

Não armazene o refresh token puro no banco. Armazene somente um hash associado a:

~~~text
userId
tokenHash
expiresAt
revokedAt?
createdAt
~~~

Essa evolução exige migration e casos de uso adicionais:

- CreateSession;
- RefreshAccessToken;
- RevokeSession;
- LogoutUser.

Não misture essa etapa com a primeira implementação. Primeiro faça login, guard, me, logout e testes funcionarem com um access token curto.

## 17. Ordem recomendada de execução

1. Corrigir UserOutput para não transportar hash.
2. Corrigir configuração JWT e atualizar .env.example.
3. Registrar cookie-parser, CORS e credentials no bootstrap.
4. Criar AuthenticatedUser, TokenProvider e constante do cookie.
5. Exportar UserRepository e HashProvider pelo UserModule.
6. Criar e registrar JwtTokenService.
7. Criar AuthModule e importá-lo no AppModule.
8. Implementar AuthenticateUserUseCase.
9. Implementar POST /auth/login e POST /auth/logout.
10. Implementar AuthGuard e CurrentUser.
11. Proteger GET /users/me.
12. Proteger atualização de usuário e validar ownership.
13. Integrar credentials: 'include' no frontend.
14. Criar testes unitários.
15. Criar testes end-to-end.
16. Só depois avaliar refresh tokens e sessões persistidas.

## 18. Comandos de validação

Execute a partir da raiz:

~~~bash
pnpm --filter api format
pnpm --filter api lint
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter api build
~~~

Valide manualmente:

~~~text
POST /auth/login com credenciais válidas  -> 200 + Set-Cookie
POST /auth/login com senha inválida       -> 401
GET  /users/me sem cookie                 -> 401
GET  /users/me com cookie                 -> 200
POST /auth/logout                         -> cookie expirado
~~~

## 19. Critérios de conclusão

A primeira versão estará concluída quando:

- o login validar email e senha usando o hash existente;
- o JWT for assinado com JWT_SECRET vindo do ambiente;
- o JWT for enviado somente em cookie HttpOnly;
- Secure for configurado corretamente por ambiente;
- CORS aceitar somente origens configuradas e permitir credenciais;
- o guard rejeitar cookie ausente, inválido ou expirado;
- request.user.id vier exclusivamente do JWT validado;
- GET /users/me funcionar somente autenticado;
- logout limpar o cookie;
- nenhuma resposta pública contiver senha ou hash;
- recursos futuros forem consultados com userId;
- testes cobrirem login, guard, me, logout e ausência de autenticação.

## 20. O que estudar durante a implementação

- diferença entre autenticação e autorização;
- inversão de dependência usando interfaces e providers;
- ciclo de vida de um request no NestJS;
- ordem guard -> controller -> caso de uso;
- assinatura, payload e expiração de JWT;
- diferença entre HttpOnly, Secure e SameSite;
- CORS e credenciais no navegador;
- por que cookies exigem preocupação com CSRF;
- isolamento multiusuário usando userId;
- diferença entre apagar cookie e revogar sessão no servidor.
