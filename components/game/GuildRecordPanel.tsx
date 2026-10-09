'use client';
import { useEffect, useRef, useState } from 'react';
import { useInteractionKeys } from '@/components/game/useInteractionKeys';
import {
  GUILD_CONTACT,
  GUILD_MENUS,
  GUILD_RECORDS,
  type GuildMenuId,
  type GuildRecord,
  type GuildRecordId,
} from '@/game/config/guildRecords';

// Pure data, no closures: the same rule ProjectShopPanel follows, so rendering
// the list never reads a ref.
type Action =
  | { kind: 'record'; label: string; record: GuildRecordId }
  | { kind: 'contact'; label: string }
  // `question` is what the player is asked before this one is followed. The
  // confirmed 네 carries no question of its own, which is also what tells the
  // renderer which of the two is the real anchor.
  | { kind: 'link'; label: string; href: string; question?: string }
  | { kind: 'cancel'; label: string }
  | { kind: 'back'; label: string }
  | { kind: 'close'; label: string };

/**
 * `record` reads like a document, the other two like a dialogue, so the arrows
 * mean different things in each: see the key handler below.
 */
type GuildPanelMode = 'menu' | 'record' | 'contact';

/**
 * The connection the player picked, held while they are asked about it.
 *
 * `mailto:` and `tel:` leave the game as abruptly as any external link —
 * further, on a phone, where they hand the whole screen to the mail client or
 * the dialler. So picking one is now a choice and leaving is a second,
 * deliberate answer, exactly as the market's Notion links already work.
 */
interface PendingContact {
  href: string;
  question: string;
  /** Where the selection goes back to on 아니오, so nothing jumps. */
  from: number;
}

/** One arrow press of scroll. Big enough to make progress, small enough to aim. */
const SCROLL_STEP = 64;

/**
 * Roughly how many lines a record's body occupies. Used only to decide whether
 * to offer the scroll hint, so it is derived from the data rather than measured
 * from the DOM — a layout read would have to run after paint and set state,
 * which is exactly the pattern the React lint rules reject.
 */
function bodyRows(record: GuildRecord) {
  const summary = record.summary ? Math.ceil(record.summary.length / 42) : 0;
  const flat = record.bullets?.length ?? 0;
  const grouped =
    record.sections?.reduce((rows, s) => rows + 2 + s.bullets.length, 0) ?? 0;
  return summary + flat + grouped;
}
/** Above this the body always overflows at the panel's capped height. */
const SCROLL_HINT_ROWS = 10;

/**
 * A guild desk: its greeting, what it offers, and whatever that opens.
 *
 * Separate from `InfoPanel` because that panel carries a single `choice`; a desk
 * offers three or four and has to come back to its own menu afterwards. All
 * views live here so one E on an NPC is one coherent flow, Esc always closes the
 * whole thing, and Enter never confirms.
 */
export function GuildRecordPanel({
  menu,
  onClose,
}: {
  menu: GuildMenuId;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const choiceNodes = useRef<(HTMLElement | null)[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<GuildPanelMode>('menu');
  const [open, setOpen] = useState<GuildRecordId | null>(null);
  const [selected, setSelected] = useState(0);
  const [pending, setPending] = useState<PendingContact | null>(null);
  const desk = GUILD_MENUS[menu];
  const record = mode === 'record' && open ? GUILD_RECORDS[open] : null;
  const showScrollHint = !!record && bodyRows(record) > SCROLL_HINT_ROWS;

  function close() {
    ref.current?.close();
    onClose();
  }

  const modeActions: Action[] =
    mode === 'menu'
      ? [
          ...desk.items.map((item): Action =>
            'record' in item
              ? { kind: 'record', label: item.label, record: item.record }
              : { kind: 'contact', label: item.label },
          ),
          { kind: 'close', label: '나가기' },
        ]
      : mode === 'contact'
        ? [
            {
              kind: 'link',
              label: '이메일 보내기',
              href: `mailto:${GUILD_CONTACT.email}`,
              question: '이메일 창이 열립니다. 정말 연결하시겠어요?',
            },
            {
              kind: 'link',
              label: '전화 걸기',
              href: `tel:${GUILD_CONTACT.phoneHref}`,
              question: '통화로 연결됩니다. 정말 연결하시겠어요?',
            },
            { kind: 'back', label: '뒤로가기' },
            { kind: 'close', label: '나가기' },
          ]
        : [
            { kind: 'back', label: '다른 기록 보기' },
            { kind: 'close', label: '나가기' },
          ];

  // Being asked replaces the row entirely, so 네 is the only thing on screen
  // that can leave and 아니오 is always right beside it.
  const actions: Action[] = pending
    ? [
        { kind: 'link', label: '네', href: pending.href },
        { kind: 'cancel', label: '아니오' },
      ]
    : modeActions;

  function show(next: GuildPanelMode, id: GuildRecordId | null) {
    setPending(null);
    setMode(next);
    setOpen(id);
    setSelected(0);
    // Every record starts at its own top, however far the last one was read.
    bodyRef.current?.scrollTo({ top: 0 });
  }

  /** Leaves the question and puts the selection back where it came from. */
  function dismiss() {
    const back = pending?.from ?? 0;
    // The list it points into is about to be a different length.
    choiceNodes.current = [];
    setPending(null);
    setSelected(back);
  }

  function activate(index: number) {
    const action = actions[index];
    if (!action) return close();
    if (action.kind === 'record') return show('record', action.record);
    if (action.kind === 'contact') return show('contact', null);
    if (action.kind === 'cancel') return dismiss();
    if (action.kind === 'link') {
      // Not asked yet: ask, rather than leave.
      if (action.question) {
        choiceNodes.current = [];
        setPending({
          href: action.href,
          question: action.question,
          from: index,
        });
        setSelected(0);
        return;
      }
      // Answered. mailto: and tel: are real anchors, so the browser's own
      // handling applies and nothing is forced into a new tab.
      return choiceNodes.current[index]?.click();
    }
    if (action.kind === 'back') return show('menu', null);
    close();
  }

  function moveSelection(step: number) {
    const next = (selected + step + actions.length) % actions.length;
    setSelected(next);
    choiceNodes.current[next]?.focus();
  }

  useInteractionKeys(
    (key, repeat) => {
      if (!ref.current?.open) return;
      // Esc backs out of the question without connecting anything; only from
      // the panel itself does it still close the whole thing.
      if (key === 'cancel') return pending ? dismiss() : close();
      if (key === 'confirm') return activate(selected);
      // Reading a record: up/down scroll the body, left/right pick the action.
      // Everywhere else all four arrows move the selection, as they always have.
      if (mode === 'record' && (key === 'up' || key === 'down')) {
        bodyRef.current?.scrollBy({
          top: key === 'up' ? -SCROLL_STEP : SCROLL_STEP,
          behavior: 'auto',
        });
        return;
      }
      // Only scroll repeats; a held arrow must not race through the actions.
      if (repeat) return;
      moveSelection(key === 'up' || key === 'left' ? -1 : 1);
    },
    { axis: true, allowRepeat: true },
  );

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const eyebrow =
    mode === 'contact'
      ? 'GUILD / RECEPTION'
      : `GUILD / ${record ? record.companyName : desk.speaker}`;
  const heading =
    mode === 'contact' ? 'Contact' : record ? record.title : desk.speaker;

  return (
    <dialog
      ref={ref}
      className="record-panel"
      data-mode={mode}
      aria-labelledby="record-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="record-head">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="record-title">{heading}</h2>
        {record && (
          <p className="record-meta">
            <span className="record-role">{record.role}</span>
            <span className="record-category">{record.category}</span>
            {record.status && (
              <span className="record-status">{record.status}</span>
            )}
          </p>
        )}
        {showScrollHint && (
          <p className="record-scroll-hint">
            ↑↓ 방향키 또는 마우스 휠로 스크롤
          </p>
        )}
      </div>

      <div className="record-body" ref={bodyRef}>
        {mode === 'menu' && <p className="dialogue-text">{desk.greeting}</p>}

        {mode === 'contact' && (
          <>
            <p className="dialogue-text">
              {pending
                ? pending.question
                : '최하진 모험가에게 연락하려면\n아래 연락처를 이용해주세요.'}
            </p>
            <dl className="contact-list">
              <dt>Email</dt>
              <dd>{GUILD_CONTACT.email}</dd>
              <dt>Phone</dt>
              <dd>{GUILD_CONTACT.phoneDisplay}</dd>
            </dl>
          </>
        )}

        {record && (
          <>
            {record.summary && (
              <p className="dialogue-text">{record.summary}</p>
            )}
            {record.bullets && record.bullets.length > 0 && (
              <ul className="record-bullets">
                {record.bullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
            {record.sections?.map((section) => (
              <section className="record-section" key={section.title}>
                <h3>
                  {section.title}
                  {section.status && (
                    <span className="record-status">{section.status}</span>
                  )}
                </h3>
                <ul className="record-bullets">
                  {section.bullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>

      <div className="record-foot">
        {record?.tech && record.tech.length > 0 && (
          <ul className="record-tech">
            {record.tech.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}
        <div className="dialogue-choices">
          {actions.map((action, index) =>
            // Only the answered 네 is a real anchor. Before that a connection
            // is an ordinary button: an `href` sitting there would hand the
            // screen to the mail client or the dialler whatever `activate` had
            // to say about it.
            action.kind === 'link' && !action.question ? (
              <a
                key={action.label}
                ref={(node) => {
                  choiceNodes.current[index] = node;
                }}
                href={action.href}
                // Fires alongside the browser's own handling, so the panel is
                // back on the contact card when the player returns to it
                // rather than still sitting on the question.
                onClick={() => dismiss()}
                data-selected={selected === index}
                aria-current={selected === index ? 'true' : undefined}
                onFocus={() => setSelected(index)}
                onPointerEnter={() => setSelected(index)}
                autoFocus={index === 0}
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
      </div>
    </dialog>
  );
}
