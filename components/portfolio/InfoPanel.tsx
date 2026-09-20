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
  | { kind: 'link'; label: string; href: string };
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
  const [answered, setAnswered] = useState(false);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0);
  const choiceButtons = useRef<(HTMLElement | null)[]>([]);
  const content = sections.find((section) => section.id === 'about')!;
  const dialogue = entry === 'about' ? null : DIALOGUES[entry];
  const branching = dialogue && 'choice' in dialogue ? dialogue : null;
  const link = dialogue && 'link' in dialogue ? dialogue.link : null;
  const linkReady = link && (!branching || answered);
  // A dialogue that only declares `exit` still gets a real choice list, so Home
  // can offer 나가기 without a question. Everything without one keeps the plain
  // close button it has today.
  const exitLabel = dialogue && 'exit' in dialogue ? dialogue.exit : null;
  const choices: DialogueAction[] = branching
    ? [
        ...(!answered
          ? [{ kind: 'advance' as const, label: branching.choice }]
          : []),
        ...(linkReady
          ? [{ kind: 'link' as const, label: link.label, href: link.href }]
          : []),
        {
          kind: 'close' as const,
          label: 'exit' in branching ? branching.exit : '나가기',
        },
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
  useInteractionKeys((action) => {
    if (!ref.current?.open) return;
    if (action === 'cancel') return close();
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
    if (answered) choiceButtons.current[0]?.focus();
  }, [answered]);
  function close() {
    ref.current?.close();
    onClose();
  }
  function handleChoice(index: number) {
    const action = choices[index];
    if (!action) {
      close();
      return;
    }
    if (action.kind === 'link') {
      choiceButtons.current[index]?.click();
      return;
    }
    if (action.kind === 'advance' && branching) {
      if ('reply' in branching) {
        setSelectedChoiceIndex(0);
        setAnswered(true);
      } else {
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
        {dialogue
          ? answered
            ? branching && 'reply' in branching
              ? branching.reply
              : dialogue.greeting
            : dialogue.greeting
          : content.text}
      </p>
      {choices.length ? (
        <div className="dialogue-choices">
          {choices.map((action, index) =>
            action.kind === 'link' ? (
              <a
                key={action.label}
                ref={(anchor) => {
                  choiceButtons.current[index] = anchor;
                }}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
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
