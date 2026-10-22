export function resolveApiUrl(configuredUrl: string | undefined, isProduction: boolean) {
  // A relative URL keeps every Preview on its own deployment and lets the
  // frontend function call Nest through Vercel's private service binding.
  return (configuredUrl ?? (isProduction ? '/api' : 'http://localhost:3000/api'))
    .replace(/\/+$/, '')
}

export const API_URL = resolveApiUrl(import.meta.env.VITE_API_URL, import.meta.env.PROD)
