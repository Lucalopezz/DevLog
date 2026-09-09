import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ResolveTechnicalIssueDto } from '../../resolve-technical-issue.dto';

describe('ResolveTechnicalIssueDto', () => {
  it('requires a textual conclusion', async () => {
    const errors = await validate(
      plainToInstance(ResolveTechnicalIssueDto, {}),
    );

    expect(errors.map((error) => error.property)).toContain('conclusion');
  });

  it('accepts a conclusion', async () => {
    const errors = await validate(
      plainToInstance(ResolveTechnicalIssueDto, {
        conclusion: 'The configuration was fixed',
      }),
    );

    expect(errors).toHaveLength(0);
  });
});
