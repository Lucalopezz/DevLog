export type AccessTokenPayload = {
  sub: string;
};

export interface TokenProvider {
  generate(payload: AccessTokenPayload): Promise<string>;
  verify(token: string): Promise<AccessTokenPayload>;
}
