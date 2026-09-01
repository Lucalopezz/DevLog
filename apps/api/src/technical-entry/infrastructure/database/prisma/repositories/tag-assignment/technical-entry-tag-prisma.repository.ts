import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { TagEntity } from '@/tag/domain/entities/tag.entity';
import {
  FindTechnicalEntryTagsInput,
  TechnicalEntryTagInput,
  TechnicalEntryTagRepository,
} from '@/technical-entry/domain/repositories/tag-assignment/technical-entry-tag.repository';
import { TagModelMapper } from '@/tag/infrastructure/database/prisma/repositories/models/tag-model.mapper';

export class TechnicalEntryTagPrismaRepository implements TechnicalEntryTagRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async add(input: TechnicalEntryTagInput): Promise<void> {
    await this.prismaService.technicalEntryTag.create({
      data: {
        technicalEntryId: input.technicalEntryId,
        tagId: input.tagId,
      },
    });
  }

  async exists(input: TechnicalEntryTagInput): Promise<boolean> {
    const association = await this.prismaService.technicalEntryTag.findUnique({
      where: {
        technicalEntryId_tagId: {
          technicalEntryId: input.technicalEntryId,
          tagId: input.tagId,
        },
      },
    });

    return !!association;
  }

  async remove(input: TechnicalEntryTagInput): Promise<void> {
    await this.prismaService.technicalEntryTag.delete({
      where: {
        technicalEntryId_tagId: {
          technicalEntryId: input.technicalEntryId,
          tagId: input.tagId,
        },
      },
    });
  }

  async findTags(
    input: FindTechnicalEntryTagsInput,
  ): Promise<Map<string, TagEntity[]>> {
    if (input.technicalEntryIds.length === 0) {
      return new Map();
    }

    // Procura as associações entre entradas técnicas e tags, filtrando pelo userId da tag
    const associations = await this.prismaService.technicalEntryTag.findMany({
      where: {
        technicalEntryId: { in: input.technicalEntryIds },
        tag: { userId: input.userId },
      },
      include: { tag: true },
    });

    const tagsByEntry = new Map<string, TagEntity[]>();

    // Retorna um Map onde a chave é o ID da entrada técnica e o valor é um array de TagEntity associadas a essa entrada
    for (const association of associations) {
      const tags = tagsByEntry.get(association.technicalEntryId) ?? [];
      tags.push(TagModelMapper.toEntity(association.tag));
      tagsByEntry.set(association.technicalEntryId, tags);
    }

    return tagsByEntry;
  }
}
