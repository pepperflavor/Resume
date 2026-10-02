'use client';
import { useState } from 'react';

/**
 * The "this is what E does" state the single-button panels show.
 *
 * Deliberately off at open. A highlight that is already on when the panel
 * appears says nothing — it is just how the button looks. One that lights up
 * the moment the player touches a direction is an answer to a question they
 * just asked, which is the RPG convention these panels are borrowing.
 *
 * It never gates anything: E runs the action whether or not the player has
 * pointed at it first. Selection is a label, not a lock.
 */
export function usePanelSelection() {
  const [selected, setSelected] = useState(false);
  return {
    selected,
    select: () => setSelected(true),
    /** Spread onto the button so a mouse says the same thing a stick does. */
    props: {
      'data-selected': selected || undefined,
      onPointerEnter: () => setSelected(true),
      onFocus: () => setSelected(true),
    },
  };
}
