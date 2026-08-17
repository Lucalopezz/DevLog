import { NotFoundException } from '@nestjs/common';
import { TagEntity } from '@/tag/domain/entities/tag.entity';
import { TagRepository } from '@/tag/domain/repositories/tag.repository';
import { TechnicalEntryEntity } from '@/technical-entry/domain/entities/technical-entry.entity';
import { TechnicalEntryType } from '@/technical-entry/domain/entities/technical-entry-type.enum';
import { TechnicalEntryRepository } from '@/technical-entry/domain/repositories/technical-entry.repository';
import { TechnicalEntryTagRepository } from '@/technical-entry/domain/repositories/technical-entry-tag.repository';
import { AssignTagToTechnicalEntryUseCase } from '../assign-tag-to-technical-entry.usecase';
import { RemoveTagFromTechnicalEntryUseCase } from '../remove-tag-from-technical-entry.usecase';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_USER_ID = '123e4567-e89b-42d3-a456-426614174001';
const ENTRY_ID = '123e4567-e89b-42d3-a456-426614174010';
const TAG_ID = '123e4567-e89b-42d3-a456-426614174011';

function makeEntry(userId = USER_ID) {
  return new TechnicalEntryEntity(
    {
      userId,
      title: 'Entrada técnica',
      context: 'Contexto da entrada',
      type: TechnicalEntryType.LEARNING,
    },
    ENTRY_ID,
  );
}

function makeTag(userId = USER_ID) {
  return new TagEntity({ userId, name: 'NestJS' }, TAG_ID);
}

describe('Casos de uso de relacionamento entre tags e entradas', () => {
  describe('AssignTagToTechnicalEntryUseCase', () => {
    it('valida a propriedade e cria a relação', async () => {
      const entryRepository = {
        findById: jest.fn().mockResolvedValue(makeEntry()),
      } as unknown as TechnicalEntryRepository;
      const tagRepository = {
        findById: jest.fn().mockResolvedValue(makeTag()),
      } as unknown as TagRepository;
      const add = jest.fn();
      const entryTagRepository = {
        exists: jest.fn().mockResolvedValue(false),
        add,
      } as unknown as TechnicalEntryTagRepository;
      const useCase = new AssignTagToTechnicalEntryUseCase(
        entryRepository,
        tagRepository,
        entryTagRepository,
      );

      await expect(
        useCase.execute({
          technicalEntryId: ENTRY_ID,
          tagId: TAG_ID,
          userId: USER_ID,
        }),
      ).resolves.toMatchObject({ id: TAG_ID, name: 'NestJS' });

      expect(add).toHaveBeenCalledWith({
        technicalEntryId: ENTRY_ID,
        tagId: TAG_ID,
      });
    });

    it('não cria relação duplicada', async () => {
      const add = jest.fn();
      const entryTagRepository = {
        exists: jest.fn().mockResolvedValue(true),
        add,
      } as unknown as TechnicalEntryTagRepository;
      const useCase = new AssignTagToTechnicalEntryUseCase(
        {
          findById: jest.fn().mockResolvedValue(makeEntry()),
        } as unknown as TechnicalEntryRepository,
        {
          findById: jest.fn().mockResolvedValue(makeTag()),
        } as unknown as TagRepository,
        entryTagRepository,
      );

      await useCase.execute({
        technicalEntryId: ENTRY_ID,
        tagId: TAG_ID,
        userId: USER_ID,
      });

      expect(add).not.toHaveBeenCalled();
    });

    it.each([
      [
        'entrada',
        jest.fn().mockResolvedValue(null),
        jest.fn().mockResolvedValue(makeTag()),
      ],
      [
        'tag',
        jest.fn().mockResolvedValue(makeEntry()),
        jest.fn().mockResolvedValue(null),
      ],
    ])(
      'rejeita %s de outro usuário ou inexistente',
      async (_resource, findEntry, findTag) => {
        const useCase = new AssignTagToTechnicalEntryUseCase(
          { findById: findEntry } as unknown as TechnicalEntryRepository,
          { findById: findTag } as unknown as TagRepository,
          {
            exists: jest.fn(),
            add: jest.fn(),
          } as unknown as TechnicalEntryTagRepository,
        );

        await expect(
          useCase.execute({
            technicalEntryId: ENTRY_ID,
            tagId: TAG_ID,
            userId: USER_ID,
          }),
        ).rejects.toBeInstanceOf(NotFoundException);
      },
    );
  });

  describe('RemoveTagFromTechnicalEntryUseCase', () => {
    it('remove somente a relação e mantém entrada e tag', async () => {
      const remove = jest.fn();
      const entryTagRepository = {
        exists: jest.fn().mockResolvedValue(true),
        remove,
      } as unknown as TechnicalEntryTagRepository;
      const useCase = new RemoveTagFromTechnicalEntryUseCase(
        {
          findById: jest.fn().mockResolvedValue(makeEntry()),
        } as unknown as TechnicalEntryRepository,
        {
          findById: jest.fn().mockResolvedValue(makeTag()),
        } as unknown as TagRepository,
        entryTagRepository,
      );

      await useCase.execute({
        technicalEntryId: ENTRY_ID,
        tagId: TAG_ID,
        userId: USER_ID,
      });

      expect(remove).toHaveBeenCalledWith({
        technicalEntryId: ENTRY_ID,
        tagId: TAG_ID,
      });
    });

    it('é idempotente quando a relação não existe', async () => {
      const remove = jest.fn();
      const entryTagRepository = {
        exists: jest.fn().mockResolvedValue(false),
        remove,
      } as unknown as TechnicalEntryTagRepository;
      const useCase = new RemoveTagFromTechnicalEntryUseCase(
        {
          findById: jest.fn().mockResolvedValue(makeEntry()),
        } as unknown as TechnicalEntryRepository,
        {
          findById: jest.fn().mockResolvedValue(makeTag()),
        } as unknown as TagRepository,
        entryTagRepository,
      );

      await useCase.execute({
        technicalEntryId: ENTRY_ID,
        tagId: TAG_ID,
        userId: USER_ID,
      });

      expect(remove).not.toHaveBeenCalled();
    });

    it('não remove relação de recurso pertencente a outro usuário', async () => {
      const remove = jest.fn();
      const entryTagRepository = {
        exists: jest.fn(),
        remove,
      } as unknown as TechnicalEntryTagRepository;
      const useCase = new RemoveTagFromTechnicalEntryUseCase(
        {
          findById: jest.fn().mockResolvedValue(makeEntry(OTHER_USER_ID)),
        } as unknown as TechnicalEntryRepository,
        {
          findById: jest.fn().mockResolvedValue(makeTag(OTHER_USER_ID)),
        } as unknown as TagRepository,
        entryTagRepository,
      );

      await expect(
        useCase.execute({
          technicalEntryId: ENTRY_ID,
          tagId: TAG_ID,
          userId: USER_ID,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(remove).not.toHaveBeenCalled();
    });
  });
});
