import type { MetadataRoute } from 'next';

/**
 * What a home-screen launch becomes: a landscape, address-bar-free window onto
 * the world, which is the whole point of the install guide the game offers on
 * a phone. `orientation` is a request, not a lock — the rotate notice still
 * covers the browsers that ignore it.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Developer Portfolio World',
    short_name: 'Portfolio',
    description: 'Node.js · TypeScript · NestJS 백엔드 개발자 포트폴리오',
    start_url: '/',
    display: 'standalone',
    orientation: 'landscape',
    background_color: '#10151d',
    theme_color: '#10151d',
    icons: [
      {
        src: '/assets/game/items/golden_cat_icon.png',
        sizes: '64x64',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
