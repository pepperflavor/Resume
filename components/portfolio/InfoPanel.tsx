'use client';
import { useEffect, useRef, useState } from 'react';
import { useInteractionKeys } from '@/components/game/useInteractionKeys';
import { DIALOGUES } from '@/game/config/dialogues';
import { sections } from './content';
import type { PortfolioEntry } from '@/game/types';
// Roles that name a place rather than a market stall.
const PLACE_ROLES: readonly string[] = [
  'Dungeon',
  'Garden',
  'Guild',
  'Home',
  'Market',
];
type DialogueAction =
  | { kind: 'advance'; label: string }
  | { kind: 'close'; label: string }
  | { kind: 'cancel'; label: string }
  | { kind: 'link'; label: string; href: string };

/**
 * What each destination is called, so the question names the place rather than
 * saying "an external page" about a CV.
 *
 * Matched on the href because that is already in the dialogue data — a link
 * does not need a second field repeating what its own address says, and a new
 * one that matches nothing still gets a sensible question.
 */
const LINK_NAMES: readonly (readonly [RegExp, string])[] = [
  // Each carries its own particle: 을 and 를 depend on the sound before them,
  // and "을(를)" in a sentence the player reads is a form to avoid.
  [/\.pdf($|\?)/i, 'Resume PDF를'],
  [/github\.com/i, 'GitHub 프로필을'],
  [/tistory\.com/i, 'Tstory 페이지를'],
];

function leavingMessage(href: string) {
  const name =
    LINK_NAMES.find(([pattern]) => pattern.test(href))?.[1] ?? '외부 페이지를';
  return `${name} 새 탭에서 열어요.\n정말 보러 가실 건가요?`;
}

/** The link the player picked, held while they are asked about it. */
interface PendingLink {
  href: string;
  /** Where the selection goes back to on 아니오, so nothing jumps. */
  from: number;
}
export function InfoPanel({
  entry,
  onClose,
  onConfirm,
}: {
  entry: PortfolioEntry;
  onClose: () => void;
  onConfirm?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  /** Which page of the dialogue is on screen; see `pages` below. */
  const [page, setPage] = useState(0);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0);
  /**
   * Set while the player is being asked about a link. Picking one no longer
   * leaves the game on the spot: a tap meant for the next line of dialogue
   * used to land in another tab before anyone could read it.
   */
  const [pending, setPending] = useState<PendingLink | null>(null);
  const choiceButtons = useRef<(HTMLElement | null)[]>([]);
  const content = sections.find((section) => section.id === 'about')!;
  const dialogue = entry === 'about' ? null : DIALOGUES[entry];
  const branching = dialogue && 'choice' in dialogue ? dialogue : null;
  const link = dialogue && 'link' in dialogue ? dialogue.link : null;
  /**
   * A branching dialogue read as what it is: pages, each carrying the button
   * that turns to the next. Nearly all of them are two — a greeting and the
   * reply to its one question — and a page with no `next` is the last one.
   *
   * The market's notice board is three, because it is read and then thought
   * about, and a list is what lets that sit in a single dialogue entry rather
   * than a chain of ids the scene would have to drive.
   */
  const pages: readonly { text: string; next: string | undefined }[] = branching
    ? [
        { text: branching.greeting, next: branching.choice },
        ...('reply' in branching
          ? [
              {
                text: branching.reply,
                next:
                  'afterthought' in branching
                    ? branching.afterthought.choice
                    : undefined,
              },
              ...('afterthought' in branching
                ? [{ text: branching.afterthought.text, next: undefined }]
                : []),
            ]
          : []),
      ]
    : [];
  const current = pages[page];
  const lastPage = page === pages.length - 1;
  const linkReady = link && (!branching || lastPage);
  // A dialogue that only declares `exit` still gets a real choice list, so Home
  // can offer 나가기 without a question. Everything without one keeps the plain
  // close button it has today.
  const exitLabel = dialogue && 'exit' in dialogue ? dialogue.exit : null;
  // `decline` is for a dialogue whose first page asks something: answering 아니오
  // is not the same gesture as 나가기, even though both close the panel.
  const closeLabel =
    page === 0 && branching && 'decline' in branching
      ? branching.decline
      : (exitLabel ?? '나가기');
  const dialogueChoices: DialogueAction[] = branching
    ? [
        ...(current?.next
          ? [{ kind: 'advance' as const, label: current.next }]
          : []),
        ...(linkReady
          ? [{ kind: 'link' as const, label: link.label, href: link.href }]
          : []),
        // Offered at the two points where leaving means something: before the
        // question, and once there is nothing left to read. In between it would
        // let the player step out between a note and the thought it provokes.
        //
        // `soleChoice` drops it entirely, for the one dialogue whose single
        // answer is itself the way on. Esc still backs out of that one — a
        // panel with no way out at all is a trap, not a flourish.
        ...((page === 0 || lastPage) && !('soleChoice' in branching)
          ? [{ kind: 'close' as const, label: closeLabel }]
          : []),
      ]
    : linkReady
      ? [
          { kind: 'link' as const, label: link.label, href: link.href },
          { kind: 'close' as const, label: '나가기' },
        ]
      : exitLabel
        ? [{ kind: 'close' as const, label: exitLabel }]
        : !dialogue
          ? [{ kind: 'close' as const, label: '나가기' }]
          : [];
  // The anchor stays a real anchor, so the browser keeps its own _blank and
  // noopener handling and the trip out is still one deliberate click.
  const choices: DialogueAction[] = pending
    ? [
        { kind: 'link', label: '네', href: pending.href },
        { kind: 'cancel', label: '아니오' },
      ]
    : dialogueChoices;
  useInteractionKeys((action) => {
    if (!ref.current?.open) return;
    // Esc backs out of the question without opening anything; only from the
    // dialogue itself does it still close the panel.
    if (action === 'cancel') return pending ? dismiss() : close();
    if (action === 'confirm') return handleChoice(selectedChoiceIndex);
    if (!choices.length) return;
    const step = action === 'prev' ? -1 : 1;
    const next = (selectedChoiceIndex + step + choices.length) % choices.length;
    setSelectedChoiceIndex(next);
    choiceButtons.current[next]?.focus();
  });
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  useEffect(() => {
    if (page > 0) choiceButtons.current[0]?.focus();
  }, [page]);
  function close() {
    ref.current?.close();
    onClose();
  }
  /** Leaves the question and puts the selection back where it came from. */
  function dismiss() {
    const back = pending?.from ?? 0;
    choiceButtons.current = [];
    setPending(null);
    setSelectedChoiceIndex(back);
  }
  function handleChoice(index: number) {
    const action = choices[index];
    if (!action) {
      close();
      return;
    }
    if (action.kind === 'cancel') return dismiss();
    if (action.kind === 'link') {
      // Unasked yet: ask, rather than leave.
      if (!pending) {
        choiceButtons.current = [];
        setPending({ href: action.href, from: index });
        setSelectedChoiceIndex(0);
        return;
      }
      // The anchor's own click handler puts the dialogue back, so confirming
      // with E and tapping 네 leave the panel in the same state.
      choiceButtons.current[index]?.click();
      return;
    }
    if (action.kind === 'advance' && branching) {
      if (page < pages.length - 1) {
        // The list it points into is about to be a different length.
        choiceButtons.current = [];
        setSelectedChoiceIndex(0);
        setPage(page + 1);
      } else {
        // Nothing left to turn to: the choice is the scene's cue instead.
        close();
        onConfirm?.();
      }
      return;
    }
    close();
  }
  return (
    <dialog
      ref={ref}
      aria-labelledby="panel-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <p className="eyebrow">
        {dialogue
          ? PLACE_ROLES.includes(dialogue.role)
            ? dialogue.role.toUpperCase()
            : 'MARKET / ' + dialogue.role
          : 'PORTFOLIO / INFO'}
      </p>
      <h2 id="panel-title">{dialogue ? dialogue.speaker : content.title}</h2>
      <p className="dialogue-text" aria-live="polite">
        {pending
          ? leavingMessage(pending.href)
          : dialogue
            ? (current?.text ?? dialogue.greeting)
            : content.text}
      </p>
      {choices.length ? (
        <div className="dialogue-choices">
          {choices.map((action, index) =>
            // Only the answered "네" is a real anchor. Before that a link is an
            // ordinary button: a click on it has to raise the question, and an
            // `href` sitting there would take the player out of the game
            // whatever `handleChoice` had to say about it.
            pending && action.kind === 'link' ? (
              <a
                key={action.label}
                ref={(anchor) => {
                  choiceButtons.current[index] = anchor;
                }}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                // Fires alongside the browser's own navigation, so the panel is
                // back on the dialogue when the player returns to this tab.
                onClick={() => dismiss()}
                data-selected={selectedChoiceIndex === index}
                aria-current={
                  selectedChoiceIndex === index ? 'true' : undefined
                }
                onFocus={() => setSelectedChoiceIndex(index)}
                onPointerEnter={() => setSelectedChoiceIndex(index)}
                autoFocus={index === 0}
              >
                {action.label}
              </a>
            ) : (
              <button
                key={action.label}
                ref={(button) => {
                  choiceButtons.current[index] = button;
                }}
                type="button"
                data-selected={selectedChoiceIndex === index}
                aria-current={
                  selectedChoiceIndex === index ? 'true' : undefined
                }
                onFocus={() => setSelectedChoiceIndex(index)}
                onPointerEnter={() => setSelectedChoiceIndex(index)}
                onClick={() => handleChoice(index)}
                autoFocus={index === 0}
              >
                {action.label}
              </button>
            ),
          )}
        </div>
      ) : (
        <button type="button" onClick={() => handleChoice(0)} autoFocus>
          나가기
        </button>
      )}
    </dialog>
  );
}
