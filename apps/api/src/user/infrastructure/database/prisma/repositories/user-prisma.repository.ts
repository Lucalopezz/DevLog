import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { UserEntity } from '@/user/domain/entities/user.entity';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { UserModelMapper } from './models/user-model.mapper';

export class UserPrismaRepository implements UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async insert(entity: UserEntity): Promise<void> {
    await this.prismaService.user.create({
      data: {
        ...entity.toJSON(),
        passwordHash: entity.password,
      },
    });
  }

  async update(entity: UserEntity): Promise<void> {
    await this.prismaService.user.update({
      where: { id: entity.id },
      data: {
        ...entity.toJSON(),
        passwordHash: entity.password,
      },
    });
  }

  async findAll(): Promise<UserEntity[]> {
    const models = await this.prismaService.user.findMany();
    return models.map((model) => UserModelMapper.toEntity(model));
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    return user ? UserModelMapper.toEntity(user) : null;
  }

  findById(id: string): Promise<UserEntity | null> {
    return this._get(id);
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.user.delete({
      where: {
        id,
      },
    });
  }

  protected async _get(id: string): Promise<UserEntity | null> {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    return user ? UserModelMapper.toEntity(user) : null;
  }
}
