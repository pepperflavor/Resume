import { GameCanvas } from '@/components/game/GameCanvas';
import { sections } from '@/components/portfolio/content';
export default function Home() {
  return (
    <>
      <a className="skip-link" href="#about">
        포트폴리오 본문으로 건너뛰기
      </a>
      <header className="site-header">
        <a className="brand" href="#">
          DEV / PORTFOLIO
        </a>
        <nav aria-label="포트폴리오 메뉴">
          {sections.map(({ id, title }) => (
            <a key={id} href={`#${id}`}>
              {title}
            </a>
          ))}
        </nav>
      </header>
      <main>
        <section className="intro" aria-labelledby="intro-title">
          <p className="eyebrow">WEB DEVELOPER</p>
          <h1 id="intro-title">
            작은 공간에서 시작하는
            <br />
            개발 이야기.
          </h1>
          <p>Node.js · TypeScript · NestJS</p>
          <a href="#about">스크롤로 포트폴리오 보기 ↓</a>
        </section>
        <section className="game-section" aria-labelledby="game-title">
          <div className="game-heading">
            <h2 id="game-title">Portfolio world</h2>
            <span>RPG WORLD</span>
          </div>
          <GameCanvas />
          <p className="controls">
            게임 화면 클릭으로 포커스 · 방향키 이동 · E 상호작용 · 대화창에서
            방향키 선택 / E 확정
          </p>
          <p className="mobile-note">
            모바일은 아직 지원하지 않아요. 웹으로 확인해주세요.
          </p>
        </section>
        <div className="portfolio-sections">
          {sections.map(({ id, title, text }, index) => (
            <section id={id} key={id} className="portfolio-section">
              <span className="section-number">0{index + 1}</span>
              <div>
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
            </section>
          ))}
        </div>
      </main>
      <footer>Developer portfolio</footer>
    </>
  );
}
