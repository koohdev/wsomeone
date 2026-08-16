import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'wsomeone',
    short_name: 'wsomeone',
    description: 'wsomeone — tactile connection cards',
    start_url: '/',
    display: 'standalone',
    background_color: '#EDEDEF',
    theme_color: '#EDEDEF',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
