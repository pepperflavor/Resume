'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInteractionKeys } from '@/components/game/useInteractionKeys';
import { usePanelSelection } from '@/components/game/usePanelSelection';

const PANEL_URL = '/assets/game/ui/quest_complete_panel.png';
const ICON = (name: string) =>
  `/assets/game/ui/icons/generated/icon-${name}.png`;

/** Where to go back to for each thing the adventure handed out. */
const GUIDE = [
  { icon: 'resume', text: 'Resume는 시장의 사슴에게,' },
  { icon: 'project', text: '프로젝트는 시장의 여우에게,' },
  {
    icon: 'career',
    text: '경력 기록은 길드 관리국에서\n다시 확인할 수 있습니다.',
  },
] as const;

/** One arrow press, in CSS pixels. A little over two lines of this body copy. */
const SCROLL_STEP = 40;

/**
 * Cut from `quest_scroll_indicator.png` to its own alpha bounds, the same way
 * every other icon here is. The source is a 1024x1536 canvas whose art covers
 * 596x856 of it; drawn whole at this size the lettering came out 25px wide,
 * because most of the box being painted was transparent margin.
 */
const SCROLL_HINT = '/assets/game/ui/icons/generated/icon-scroll-hint.png';
/** Slack for the bottom test: a fractional layout never lands on exactly 0. */
const BOTTOM_EPSILON = 2;

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={ICON(name)} alt="" aria-hidden="true" />
  );
}

/**
 * The end of the golden cat's road, and the one place the player is told where
 * everything they walked past actually lives.
 *
 * It opens off the fairy's single answer rather than being a page of her
 * dialogue, because what it has to say is a list with pictures and a dialogue
 * box is a paragraph. It writes nothing: there is no `endingSeen` flag, the
 * quest stays OFFERED, and walking back to the pond opens it again.
 *
 * The body scrolls inside the painted teal panel rather than the type being
 * shrunk until it fits. Up and down move that scroll; left and right — and a
 * down press with nowhere left to go — point at the way out instead.
 */
export function QuestCompletePanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const selection = usePanelSelection();
  /**
   * Whether the body has more than it can show, and whether the reader has
   * reached the end of it. Both are measured off the element rather than
   * guessed from the copy: how much fits depends on the panel's size, which
   * depends on the viewport.
   */
  const [overflowing, setOverflowing] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  const measure = useCallback(() => {
    const region = body.current;
    if (!region) return;
    setOverflowing(region.scrollHeight > region.clientHeight + 1);
    setAtBottom(
      region.scrollHeight - (region.scrollTop + region.clientHeight) <=
        BOTTOM_EPSILON,
    );
  }, []);

  // The panel is sized from the viewport, so what fits changes with a rotation
  // or a resize. Observing the region itself catches every route to that —
  // including the CSS-only ones a window listener never hears about.
  useEffect(() => {
    const region = body.current;
    if (!region) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  function close() {
    ref.current?.close();
    onClose();
  }

  /** True when the scroll actually moved, so the caller can fall through. */
  function scrollBy(amount: number) {
    const region = body.current;
    if (!region) return false;
    const limit = region.scrollHeight - region.clientHeight;
    if (limit <= 1) return false;
    const next = Math.max(0, Math.min(limit, region.scrollTop + amount));
    if (Math.abs(next - region.scrollTop) < 0.5) return false;
    region.scrollTop = next;
    return true;
  }

  useInteractionKeys(
    (action) => {
      if (!ref.current?.open) return;
      if (action === 'cancel') return close();
      if (action === 'confirm') {
        button.current?.focus();
        return close();
      }
      // Reading comes first: up and down are the body's until it runs out, and
      // only then do they mean the button. Left and right always mean it.
      if (action === 'up' && scrollBy(-SCROLL_STEP)) return;
      if (action === 'down' && scrollBy(SCROLL_STEP)) return;
      selection.select();
    },
    // `axis` keeps up/down apart from left/right; repeat lets a held arrow keep
    // scrolling, which confirm and cancel never do.
    { axis: true, allowRepeat: true },
  );

  return (
    <dialog
      ref={ref}
      className="quest-complete"
      aria-labelledby="quest-complete-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div
        className="quest-complete-inner"
        style={{ backgroundImage: `url('${PANEL_URL}')` }}
      >
        {/* A hint, not a control: it appears only when there is something below
            the fold and fades once the reader gets there. `scroll` covers every
            way the body moves — wheel, touch, and the arrow keys, which set
            `scrollTop` and so fire it too. */}
        {overflowing && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="quest-scroll-hint"
            data-spent={atBottom || undefined}
            src={SCROLL_HINT}
            alt=""
            aria-hidden="true"
          />
        )}
        <div className="panel-region quest-complete-title-region">
          <h2 id="quest-complete-title">QUEST COMPLETE</h2>
        </div>
        {/* Takes the modal's opening focus, so the button starts unselected and
            a wheel or an arrow lands on the text that is meant to be read. */}
        <div
          ref={body}
          className="quest-complete-scroll"
          tabIndex={-1}
          autoFocus
          onScroll={measure}
        >
          <p className="quest-complete-lead">모험을 즐겨주셔서 감사합니다.</p>
          <ul className="quest-complete-guide">
            {GUIDE.map((row) => (
              <li key={row.icon}>
                <Icon name={row.icon} className="quest-complete-icon" />
                <span>{row.text}</span>
              </li>
            ))}
          </ul>
          <p className="quest-complete-restart">
            <Icon name="restart" className="quest-complete-icon" />
            <span>
              {
                '처음부터 다시 걷고 싶다면\n설정에서 “처음부터 다시 시작”을 눌러주세요.'
              }
            </span>
          </p>
        </div>
        <div className="panel-region quest-complete-action-region">
          <button
            ref={button}
            type="button"
            className="panel-action"
            onClick={close}
            {...selection.props}
          >
            <Icon name="return" className="panel-action-icon" />
            모험으로 돌아가기
          </button>
        </div>
      </div>
    </dialog>
  );
}
