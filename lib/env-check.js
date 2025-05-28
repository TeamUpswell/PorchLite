export function checkRequiredEnvVars() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GOOGLE_PLACES_API_KEY'
  ];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      return false;
    }
  }
  return true;
}