import {
  ArgumentMetadata,
  HttpStatus,
  Injectable,
  ParseUUIDPipe,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class UuidParamValidationPipe implements PipeTransform {
  private readonly uuidPipe = new ParseUUIDPipe({
    version: '4',
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  });
  // Função que vem do NestJS, que é chamada para transformar o valor do parâmetro antes de ser passado para
  // o manipulador de rota. Aqui, verificamos se o parâmetro é um UUID válido usando o ParseUUIDPipe.
  async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<unknown> {
    if (!this.isUuidParam(metadata)) {
      return value;
    }

    return this.uuidPipe.transform(value as string, metadata);
  }

  private isUuidParam(metadata: ArgumentMetadata): boolean {
    return (
      metadata.type === 'param' &&
      typeof metadata.data === 'string' &&
      (metadata.data === 'id' || metadata.data.endsWith('Id'))
    );
  }
}
