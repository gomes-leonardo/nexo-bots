/**
 * Variáveis de ambiente do servidor, lidas num lugar só.
 * Adicione aqui cada variável nova e documente em `.env.example`.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
} as const;

export function requireEnv(name: keyof typeof env): string {
  const value = env[name];
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}
