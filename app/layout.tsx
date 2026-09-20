import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Developer Portfolio',
  icons: { icon: '/assets/game/items/golden_cat_icon.png' },
  description: 'Node.js · TypeScript · NestJS 백엔드 개발자 포트폴리오',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
