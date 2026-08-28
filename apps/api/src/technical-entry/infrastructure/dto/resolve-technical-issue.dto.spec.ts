import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ResolveTechnicalIssueDto } from './resolve-technical-issue.dto';

describe('ResolveTechnicalIssueDto', () => {
  it('exige uma conclusão textual', async () => {
    const errors = await validate(
      plainToInstance(ResolveTechnicalIssueDto, {}),
    );

    expect(errors.map((error) => error.property)).toContain('conclusion');
  });

  it('aceita uma conclusão', async () => {
    const errors = await validate(
      plainToInstance(ResolveTechnicalIssueDto, {
        conclusion: 'A configuração foi corrigida',
      }),
    );

    expect(errors).toHaveLength(0);
  });
});
