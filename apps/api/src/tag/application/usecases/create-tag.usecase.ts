import { UseCaseContract } from '@/shared/application/usecases/use-case-contract';
import { TagOutput, TagOutputMapper } from '../dto/tag.dto';
import { TagRepository } from '@/tag/domain/repositories/tag.repository';
import { UserRepository } from '@/user/domain/repositories/user.repository';
import { NotFoundException } from '@nestjs/common';
import { TagEntity } from '@/tag/domain/entities/tag.entity';

export type CreateTagUseCaseInput = {
  name: string;
  userId: string;
};

export type CreateTagUseCaseOutput = TagOutput;

export class CreateTagUseCase implements UseCaseContract<
  CreateTagUseCaseInput,
  CreateTagUseCaseOutput
> {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly userRepository: UserRepository,
  ) {}
  async execute(input: CreateTagUseCaseInput): Promise<TagOutput> {
    const { name, userId } = input;
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const entity = new TagEntity({
      name,
      userId,
    });

    await this.tagRepository.insert(entity);

    return TagOutputMapper.toOutput(entity);
  }
}
