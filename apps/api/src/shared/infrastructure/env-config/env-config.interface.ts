export interface EnvConfig {
  getAppPort(): number;
  getNodeEnv(): string;
  getJwtSecret(): string;
  getJtwExpiresInSeconds(): number;
  getCorsAllowedOrigins(): string[];
}
