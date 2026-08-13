import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserPrismaRepository } from '@/user/infrastructure/database/prisma/repositories/user-prisma.repository';
import { CreateTagUseCase } from '../application/usecases/create-tag.usecase';
import { TagRepository } from '../domain/repositories/tag.repository';

@Module({
  controllers: [TagController],
  providers: [
    {
      provide: 'PrismaService',
      useClass: PrismaService,
    },
    {
      provide: 'TagRepository',
      useFactory: (prismaService: PrismaService) => {
        return new UserPrismaRepository(prismaService);
      },
      inject: ['PrismaService'],
    },
    {
      provide: 'UserRepository',
      useFactory: (prismaService: PrismaService) => {
        return new UserPrismaRepository(prismaService);
      },
      inject: ['PrismaService'],
    },
    {
      provide: CreateTagUseCase,
      useFactory: (
        tagRepository: TagRepository,
        userRepository: UserPrismaRepository,
      ) => {
        return new CreateTagUseCase(tagRepository, userRepository);
      },
      inject: ['TagRepository', 'UserRepository'],
    },
  ],
})
export class TagModule {}
