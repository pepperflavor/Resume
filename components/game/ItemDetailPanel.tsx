'use client';
import { useEffect, useRef } from 'react';
import { useInteractionKeys } from '@/components/game/useInteractionKeys';
import { usePanelSelection } from '@/components/game/usePanelSelection';
import { itemDescription, spriteFit, type ItemInfo } from '@/game/config/items';

const PANEL_URL = '/assets/game/ui/item_detail_panel.png';
const EXIT_ICON = '/assets/game/ui/icons/generated/icon-exit.png';

/**
 * What one carried thing is, opened from its own HUD icon.
 *
 * The painted panel has five plates on it, so the markup has five regions: a
 * box per plate, placed as a percentage of the art, each centring whatever it
 * holds. Nothing is in normal flow, because nothing here should be able to
 * push anything else off its plate.
 *
 * The picture is the HUD's background rule reused at panel size rather than a
 * second copy of the art, so the thing in the bag and the thing in the panel
 * can never drift apart. Nothing is stored: the panel is handed an item the
 * quest state already says is being carried, and it reads the player's name
 * straight off the save rather than keeping its own.
 */
export function ItemDetailPanel({
  item,
  playerName,
  onClose,
}: {
  item: ItemInfo;
  playerName: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const selection = usePanelSelection();

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  function close() {
    ref.current?.close();
    onClose();
  }

  useInteractionKeys((action) => {
    if (!ref.current?.open) return;
    if (action === 'cancel') return close();
    // E runs the one action whether or not it has been pointed at first.
    if (action === 'confirm') {
      button.current?.focus();
      return close();
    }
    // Any direction, from a keyboard or the stick, means "what does E do here".
    selection.select();
  });

  const fit = spriteFit(item);

  return (
    <dialog
      ref={ref}
      className="item-detail"
      aria-labelledby="item-detail-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      {/* Takes the modal's opening focus so the one button does not start out
          looking selected: the highlight is an answer to a direction press,
          and it says nothing if it is already on. Tab still reaches it. */}
      <div
        className="item-detail-inner"
        tabIndex={-1}
        autoFocus
        style={{ backgroundImage: `url('${PANEL_URL}')` }}
      >
        <div className="panel-region item-detail-title-region">
          <h2 id="item-detail-title">아이템 정보</h2>
        </div>
        <div className="panel-region item-detail-image-region">
          <span
            className={`item-detail-sprite ${item.spriteClass}`}
            aria-hidden="true"
            style={{
              // Sized so the ink — not the canvas — matches across items, then
              // nudged by the ink's own offset so it lands in the middle.
              height: `${fit.size * 100}%`,
              width: `${fit.size * 100}%`,
              translate: `${fit.offsetX * 100}% ${fit.offsetY * 100}%`,
            }}
          />
        </div>
        <div className="panel-region item-detail-name-region">
          <p className="item-detail-name">{item.name}</p>
        </div>
        <div className="panel-region item-detail-description-region">
          <p className="item-detail-text">
            {itemDescription(item, playerName)}
          </p>
        </div>
        <div className="panel-region item-detail-action-region">
          <button
            ref={button}
            type="button"
            className="panel-action"
            onClick={close}
            {...selection.props}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="panel-action-icon"
              src={EXIT_ICON}
              alt=""
              aria-hidden="true"
            />
            나가기
          </button>
        </div>
      </div>
    </dialog>
  );
}
