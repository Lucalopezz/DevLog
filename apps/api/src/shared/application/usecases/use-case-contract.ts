export interface UseCaseContract<Input, Output> {
  execute(input: Input): Promise<Output> | Output;
}
