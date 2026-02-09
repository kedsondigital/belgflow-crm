/** @type {import('next').NextConfig} */
// Placeholders para build sem env - substituídos em runtime pelo script de startup
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '__NEXT_PUBLIC_SUPABASE_URL__'
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '__NEXT_PUBLIC_SUPABASE_ANON_KEY__'
const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || '__NEXT_PUBLIC_SITE_URL__'

const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
    ],
  },
};

export default nextConfig;
