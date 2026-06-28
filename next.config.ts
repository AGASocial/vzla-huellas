import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  images: {
    // Permite que next/image optimice y cachee en el edge de Vercel las
    // imágenes servidas desde Supabase Storage, en vez de que cada
    // visitante las vuelva a pedir directo a Supabase.
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
      : [],
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
