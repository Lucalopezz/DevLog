import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import {
  TechnicalEntryTagInput,
  TechnicalEntryTagRepository,
} from '@/technical-entry/domain/repositories/technical-entry-tag.repository';

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
}
