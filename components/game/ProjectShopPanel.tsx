'use client';
import { useEffect, useRef, useState } from 'react';
import { SpriteIcon } from '@/components/game/SpriteIcon';
import { useInteractionKeys } from '@/components/game/useInteractionKeys';
import {
  PROJECT_ITEMS,
  SPECIAL_SET,
  type ProjectItem,
} from '@/components/portfolio/projects';
import { MARKET_SHEET_KEYS } from '@/game/config/marketAssets';
import {
  getKkokkoQuest,
  getPlayerName,
  setKkokkoQuest,
} from '@/game/state/gameState';

const SHEET = MARKET_SHEET_KEYS.projshop;
const SHEET_URL =
  '/assets/game/maps/market/props/market_project_shop_props.png';
const PRODUCE_FRAME = {
  apple: 'apple-single',
  potato: 'potato-single',
  carrot: 'carrot-single',
  // The audited mixed produce crate: component 14 of market-projshop.
  special: 'produce-crate',
} as const;

type View = 'stock' | 'questOffer' | 'questDone';

type ActId = 'askQuest' | 'acceptQuest' | 'finishQuest';

// Pure data on purpose: keeping closures out of this list means rendering it
// never touches a ref, and the whole panel stays one readable sequence.
type Action =
  | { kind: 'card'; item: ProjectItem }
  | { kind: 'link'; label: string; href: string }
  | { kind: 'act'; label: string; act: ActId }
  | { kind: 'close'; label: string };

/**
 * The fox's stall. Each produce card is itself one choice — there is no second
 * row of "프로젝트 보기" buttons duplicating them. The Kkokko quest lives in
 * the same panel so talking to the fox is one coherent flow.
 */
export function ProjectShopPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const choiceNodes = useRef<(HTMLElement | null)[]>([]);
  const quest = getKkokkoQuest();
  const playerName = getPlayerName() || '여행자';
  // Arriving with Kkokko in hand opens on the thank-you, not the stock list.
  const [view, setView] = useState<View>(
    quest === 'CHICKEN_FOUND' ? 'questDone' : 'stock',
  );
  const [selected, setSelected] = useState(0);
  const [completed, setCompleted] = useState(quest === 'COMPLETED');

  function close() {
    ref.current?.close();
    onClose();
  }

  // The fox's thank-you joins the shelf itself once the quest is done.
  const stock: ProjectItem[] = completed
    ? [...PROJECT_ITEMS, SPECIAL_SET]
    : [...PROJECT_ITEMS];

  const stockActions: Action[] = [
    ...stock.map((item): Action => ({ kind: 'card', item })),
    ...(quest === 'NOT_STARTED'
      ? [
          {
            kind: 'act' as const,
            label: '어떤 도움이 필요한지 묻기',
            act: 'askQuest' as const,
          },
        ]
      : []),
    { kind: 'close', label: '나가기' },
  ];

  const actions: Action[] =
    view === 'stock'
      ? stockActions
      : view === 'questOffer'
        ? [
            { kind: 'act', label: '찾아줄게', act: 'acceptQuest' },
            { kind: 'close', label: '나가기' },
          ]
        : [
            { kind: 'act', label: '천만에', act: 'finishQuest' },
            { kind: 'close', label: '나가기' },
          ];

  function run(act: ActId) {
    if (act === 'askQuest') {
      setSelected(0);
      setView('questOffer');
      return;
    }
    if (act === 'acceptQuest') {
      setKkokkoQuest('ACCEPTED');
      close();
      return;
    }
    setKkokkoQuest('COMPLETED');
    setCompleted(true);
    setSelected(0);
    setView('stock');
  }

  function activate(index: number) {
    const action = actions[index];
    if (!action) return close();
    // Cards and reward links are real anchors; clicking them keeps the browser's
    // own _blank + noopener handling rather than calling window.open by hand.
    if (action.kind === 'card' || action.kind === 'link')
      return choiceNodes.current[index]?.click();
    if (action.kind === 'act') return run(action.act);
    close();
  }

  useInteractionKeys((key) => {
    if (!ref.current?.open) return;
    if (key === 'cancel') return close();
    if (key === 'confirm') return activate(selected);
    const step = key === 'prev' ? -1 : 1;
    const next = (selected + step + actions.length) % actions.length;
    setSelected(next);
    choiceNodes.current[next]?.focus();
  });

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  // Cards render in their own list above, so the choice row draws the rest —
  // carrying each action's absolute index so keyboard order stays one sequence.
  const tail = actions
    .map((action, index) => ({ action, index }))
    .filter(
      (
        entry,
      ): entry is {
        action: Exclude<Action, { kind: 'card' }>;
        index: number;
      } => entry.action.kind !== 'card',
    );

  return (
    <dialog
      ref={ref}
      className="shop-panel"
      aria-labelledby="shop-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <p className="eyebrow">MARKET / PROJECTS</p>
      <h2 id="shop-title">여우의 프로젝트 가게</h2>

      {/* Says where a card actually leads, before the player picks one. Only
          over the shelf: the quest views have no produce to buy. */}
      {view === 'stock' && (
        <p className="shop-note shop-intro">
          야채를 구매하면 Notion으로 이동합니다.
        </p>
      )}

      {view === 'stock' && (
        <ul className="shop-stock">
          {stock.map((item, index) => (
            <li key={item.id}>
              <a
                ref={(node) => {
                  choiceNodes.current[index] = node;
                }}
                className="shop-card"
                data-special={item.special ? 'true' : undefined}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                data-selected={selected === index}
                aria-current={selected === index ? 'true' : undefined}
                onFocus={() => setSelected(index)}
                onPointerEnter={() => setSelected(index)}
                autoFocus={index === 0}
              >
                <SpriteIcon
                  sheet={SHEET}
                  frame={PRODUCE_FRAME[item.produce]}
                  url={SHEET_URL}
                  size={44}
                  className="shop-produce"
                />
                <span className="shop-detail">
                  <span className="shop-name">
                    <span>{item.name}</span>
                    <span
                      className={
                        item.special ? 'shop-price shop-reward' : 'shop-price'
                      }
                    >
                      {item.price}
                    </span>
                  </span>
                  <span className="shop-stack">{item.stack.join(' · ')}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {view === 'questOffer' && (
        <p className="dialogue-text">
          {`${playerName}씨! 도와줘!\n우리집 꼬꼬가 사라졌어...\n분명 근처에 있을 텐데 혹시 찾아줄 수 있을까?`}
        </p>
      )}

      {view === 'questDone' && (
        <p className="dialogue-text">
          {`${playerName}씨!\n꼬꼬를 찾아줬구나! 고마워,\n답례로 너에게만 특별한 세트를 팔게!`}
        </p>
      )}

      {view === 'stock' && quest === 'ACCEPTED' && (
        <p className="shop-note">
          꼬꼬는 아직 못 찾았어… 집 마당 쪽을 한번 봐 줄래?
        </p>
      )}

      <div className="dialogue-choices">
        {tail.map(({ action, index }) =>
          action.kind === 'link' ? (
            <a
              key={action.label}
              ref={(node) => {
                choiceNodes.current[index] = node;
              }}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              data-selected={selected === index}
              aria-current={selected === index ? 'true' : undefined}
              onFocus={() => setSelected(index)}
              onPointerEnter={() => setSelected(index)}
            >
              {action.label}
            </a>
          ) : (
            <button
              key={action.label}
              ref={(node) => {
                choiceNodes.current[index] = node;
              }}
              type="button"
              data-selected={selected === index}
              aria-current={selected === index ? 'true' : undefined}
              onFocus={() => setSelected(index)}
              onPointerEnter={() => setSelected(index)}
              onClick={() => activate(index)}
              autoFocus={index === 0}
            >
              {action.label}
            </button>
          ),
        )}
      </div>
    </dialog>
  );
}
