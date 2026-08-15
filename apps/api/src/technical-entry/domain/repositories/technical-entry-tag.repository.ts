export type TechnicalEntryTagInput = {
  technicalEntryId: string;
  tagId: string;
};

// Mantém compatibilidade com o nome usado inicialmente pela interface.
export type TechnicalEntryInput = TechnicalEntryTagInput;

export interface TechnicalEntryTagRepository {
  add(input: TechnicalEntryTagInput): Promise<void>;

  remove(input: TechnicalEntryTagInput): Promise<void>;

  exists(input: TechnicalEntryTagInput): Promise<boolean>;
}
