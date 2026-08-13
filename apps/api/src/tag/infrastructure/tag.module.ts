import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserPrismaRepository } from '@/user/infrastructure/database/prisma/repositories/user-prisma.repository';
import { CreateTagUseCase } from '../application/usecases/create-tag.usecase';
import { TagRepository } from '../domain/repositories/tag.repository';
import { TagPrismaRepository } from './database/prisma/repositories/tag-prisma.repository';
import { SearchTagUseCase } from '../application/usecases/search-tag.usecase';
import { DeleteTagUseCase } from '../application/usecases/delete-tag.usecase';
import { AuthModule } from '@/auth/infrastructure/auth.module';

@Module({
  controllers: [TagController],
  imports: [AuthModule],
  providers: [
    {
      provide: 'PrismaService',
      useClass: PrismaService,
    },
    {
      provide: 'TagRepository',
      useFactory: (prismaService: PrismaService) => {
        return new TagPrismaRepository(prismaService);
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
    {
      provide: SearchTagUseCase,
      useFactory: (tagRepository: TagRepository) => {
        return new SearchTagUseCase(tagRepository);
      },
      inject: ['TagRepository'],
    },
    {
      provide: DeleteTagUseCase,
      useFactory: (tagRepository: TagRepository) => {
        return new DeleteTagUseCase(tagRepository);
      },
      inject: ['TagRepository'],
    },
  ],
})
export class TagModule {}
