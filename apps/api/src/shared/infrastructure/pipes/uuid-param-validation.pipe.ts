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
  // NestJS calls this function to transform a parameter value before passing it to
  // the route handler. Here, ParseUUIDPipe checks whether the parameter is a valid UUID.
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
