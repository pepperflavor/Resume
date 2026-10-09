import * as Phaser from 'phaser';
import {
  FRONT_DEPTH,
  GUILD_BUBBLE_RANGE,
  GUILD_FLOOR_ACCESS,
  GUILD_FLOOR_TARGETS,
  GUILD_INTERIOR_COLLISION,
  GUILD_INTERIOR_NPCS,
  GUILD_INTERIOR_SIGNS,
  guildTargetDistance,
  REQUIRED_GUILD_NPC_IDS,
  signPanel,
  GUILD_INTERIOR_WORLD,
  GUILD_WARP,
  npcTarget,
  type GuildTarget,
} from '@/game/config/guildInterior';
import {
  GUILD_INTERIOR_TEXTURES,
  GUILD_NPC_KINDS,
  GUILD_NPC_SHEETS,
  guildNpcFrameName,
} from '@/game/config/guildAssets';
import { SCENE_KEYS, spawnPoint, type SceneEntry } from '@/game/config/scenes';
import {
  loadPlayerAssets,
  loadQuestMarkerAssets,
} from '@/game/loaders/characters';
import { guildInteriorScenery } from '@/game/objects/guildInteriorScenery';
import { HintBubble } from '@/game/objects/HintBubble';
import { QuestExclamation } from '@/game/objects/QuestMarker';
import { WarpCircle, loadWarpAssets } from '@/game/objects/WarpCircle';
import { InteractionMissBubble } from '@/game/objects/InteractionMissBubble';
import { Player } from '@/game/objects/Player';
import { InputManager } from '@/game/input/InputManager';
import { configureSceneCamera } from '@/game/systems/SceneCamera';
import { SceneTransition } from '@/game/systems/SceneTransition';
import type { CollisionRect, GameCallbacks } from '@/game/types';
import { setSceneBgm } from '@/game/state/audio';
import {
  hasTalkedToGuildNpc,
  markGuildNpcTalked,
} from '@/game/state/gameState';

const PRESS_HINT = 'Press E';
/**
 * Lowest a bubble may float, in screen space. The HUD's mute and settings
 * buttons sit on the frame's top-right corner, so a bubble that would ride up
 * under them is pushed back down instead.
 */
const BUBBLE_SCREEN_MARGIN = 56;
/** Logical frame 0 is the down-idle pose for every guild NPC. */
const IDLE_FRAME = 0;
const SIGN_TEXT_DEPTH = FRONT_DEPTH + 1;
/** Free panel on each side of the lettering, as a fraction of the panel. */
const SIGN_TEXT_MARGIN = 0.06;
/**
 * The range a plaque's lettering may be set in. It starts at the top and steps
 * down a point at a time until it fits, so each board is drawn at the size it
 * is finally shown at rather than being set once and squashed.
 */
const SIGN_TEXT_MAX_SIZE = 13;
const SIGN_TEXT_MIN_SIZE = 7;

interface InteriorTarget {
  target: GuildTarget;
  hint: HintBubble;
  /** Only the desks on the required list carry one. */
  marker?: QuestExclamation;
}

export class GuildInteriorScene extends Phaser.Scene {
  private player!: Player;
  private miss!: InteractionMissBubble;
  private controls!: InputManager;
  private travel!: SceneTransition;
  private targets: InteriorTarget[] = [];
  private entry: SceneEntry = {};

  constructor(private readonly callbacks: GameCallbacks) {
    super(SCENE_KEYS.guildInterior);
  }

  init(entry: SceneEntry = {}) {
    this.entry = entry;
    // Phaser reuses the scene instance, so nothing may survive a shutdown.
    this.targets = [];
  }

  preload() {
    loadPlayerAssets(this);
    loadWarpAssets(this);
    loadQuestMarkerAssets(this);
    for (const asset of GUILD_INTERIOR_TEXTURES)
      if (!this.textures.exists(asset.key))
        this.load.image(asset.key, asset.url);
    for (const kind of GUILD_NPC_KINDS) {
      const sheet = GUILD_NPC_SHEETS[kind];
      if (!this.textures.exists(sheet.key))
        this.load.image(sheet.key, sheet.url);
    }
  }

  create() {
    setSceneBgm('guildInterior');
    for (const op of guildInteriorScenery()) {
      const texture = this.textures.get(op.texture);
      if (!texture.has(op.frameName))
        texture.add(
          op.frameName,
          0,
          op.frame.x,
          op.frame.y,
          op.frame.width,
          op.frame.height,
        );
      const image = this.add
        .image(op.x, op.y, op.texture, op.frameName)
        .setOrigin(op.originX, op.originY)
        .setScale(op.scaleX, op.scaleY)
        .setDepth(op.depth);
      if (op.flipX) image.setFlipX(true);
      if (op.flipY) image.setFlipY(true);
      if (op.flipY) image.setFlipY(true);
    }
    // Lettering goes inside the board's own cream panel, with no box of its
    // own, so it reads as engraved rather than as a label floating in front.
    //
    // It used to be set at 10px and then shrunk with `setScale` to fit. That is
    // what made it look broken: a Text is drawn to its own little canvas first,
    // and `pixelArt` samples that canvas nearest-neighbour, so scaling it down
    // drops whole rows out of strokes already only a pixel wide. Here the size
    // comes down a point at a time and the glyphs are redrawn at the size they
    // end up, which is the one thing that keeps them whole.
    for (const sign of GUILD_INTERIOR_SIGNS.filter((board) => board.label)) {
      const panel = signPanel(sign);
      const label = this.add
        .text(0, 0, sign.label, {
          fontFamily: 'monospace',
          fontSize: `${SIGN_TEXT_MAX_SIZE}px`,
          color: '#4a3a24',
        })
        .setOrigin(0.5)
        .setDepth(SIGN_TEXT_DEPTH);
      // `setResolution` is deliberately not used: in this Phaser build it
      // doubles what is drawn while `width` keeps reporting the single-size
      // figure, so the fit below would measure one thing and show another.
      const room = 1 - SIGN_TEXT_MARGIN * 2;
      for (
        let size = SIGN_TEXT_MAX_SIZE;
        size > SIGN_TEXT_MIN_SIZE &&
        (label.width > panel.width * room ||
          label.height > panel.height * room);
        size -= 1
      )
        label.setFontSize(size);
      // Whole pixels. The panel's own centre falls on a fraction — it is a
      // percentage of a scaled frame — and half a pixel is the difference
      // between a letter and a smear.
      label.setPosition(Math.round(panel.x), Math.round(panel.y));
    }

    const obstacles: CollisionRect[] = [
      ...GUILD_INTERIOR_COLLISION.map((rect) => ({ ...rect })),
      ...GUILD_INTERIOR_NPCS.map((npc) => ({
        x: npc.x - npc.collision.width / 2,
        y: npc.y - npc.collision.height,
        width: npc.collision.width,
        height: npc.collision.height,
      })),
    ];
    this.addNpcs();

    this.player = new Player(
      this,
      obstacles,
      spawnPoint('guildInterior', this.entry),
      GUILD_INTERIOR_WORLD,
    );
    this.player.face('up');

    // Same camera contract as Market: bounds plus follow.
    configureSceneCamera(this, this.player, GUILD_INTERIOR_WORLD);

    new WarpCircle(this, {
      x: GUILD_WARP.x,
      y: GUILD_WARP.y,
      width: GUILD_WARP.width,
      glowAlpha: GUILD_WARP.glowAlpha,
      depth: GUILD_WARP.depth,
    });
    this.miss = new InteractionMissBubble(this, this.player.body);
    this.travel = new SceneTransition(this, this.player, 'guildInterior');
    this.controls = new InputManager(
      this,
      () => {
        if (this.travel.locked || this.callbacks.isOverlayOpen()) return;
        const target = this.nearestTarget();
        if (!target) {
          this.miss.show();
          return;
        }
        this.miss.hide();
        this.player.stop();
        this.controls.reset();
        // Recorded as the desk is opened, which is what "has been spoken to"
        // means here: the record panel owns the screen from this point and
        // never reports back. Only ids on the required list are stored, so the
        // stairway warp can never count toward the dungeon's gate.
        if (REQUIRED_GUILD_NPC_IDS.includes(target.target.id))
          markGuildNpcTalked(target.target.id);
        const { interaction, floorAccess } = target.target;
        // The warp routes to its floor once one exists; until then it opens the
        // locked line, so enabling it later is a config change, not a code one.
        if (floorAccess) {
          const access = GUILD_FLOOR_ACCESS[floorAccess];
          if (access.enabled && access.targetScene) {
            this.travel.start(access.targetScene, { from: 'guildInterior' });
            return;
          }
        }
        if (interaction.type === 'record')
          this.callbacks.onOpenGuildRecord(interaction.menu);
        else this.callbacks.onInteract(interaction.dialogue);
      },
      {
        isOverlayOpen: () => this.callbacks.isOverlayOpen(),
        isTravelLocked: () => this.travel.locked,
      },
    );
    this.refreshQuestMarkers();
    this.travel.enter(Boolean(this.entry.from));
    this.callbacks.onReady();
  }

  /**
   * Every NPC is stationary in this pass, so each is one sprite on its own
   * down-idle frame. The sheets are not a uniform 3x4 grid, so frames are
   * registered one by one from the audit rather than sliced by division.
   */
  private addNpcs() {
    for (const npc of GUILD_INTERIOR_NPCS) {
      const sheet = GUILD_NPC_SHEETS[npc.kind];
      const texture = this.textures.get(sheet.key);
      for (const frame of sheet.frames) {
        const name = guildNpcFrameName(npc.kind, frame.index);
        if (!texture.has(name))
          texture.add(name, 0, frame.x, frame.y, frame.width, frame.height);
      }
      this.add
        .image(npc.x, npc.y, sheet.key, guildNpcFrameName(npc.kind, IDLE_FRAME))
        .setOrigin(0.5, 1)
        .setScale(npc.scale)
        .setDepth(npc.y)
        .setName(`guild-npc-${npc.id}`);
      this.addTarget(npcTarget(npc));
    }
    // The two stairways join the same contest as the desks.
    for (const target of GUILD_FLOOR_TARGETS) this.addTarget(target);
  }

  private addTarget(target: GuildTarget) {
    const hint = new HintBubble(this, target.bubble.x, target.bubble.y);
    hint.setText(target.hint);
    // Nothing speaks up until it is approached, badge or no badge — see
    // `refreshHints`, which is now the only thing that turns a bubble on.
    hint.setVisible(false);
    const marker =
      target.marker && REQUIRED_GUILD_NPC_IDS.includes(target.id)
        ? new QuestExclamation(this, target.marker.x, target.marker.y, {
            name: `guild-quest-marker-${target.id}`,
          })
        : undefined;
    this.targets.push({ target, hint, marker });
  }

  /**
   * One winner only, so a single E can never fire two desks at once.
   *
   * Distance is `guildTargetDistance`, the same measure the bubbles use, so
   * anything close enough to greet the player is close enough to answer them —
   * from whichever side they walked up.
   */
  private nearestTarget() {
    const body = this.player.body;
    return this.targets
      .map((target) => ({
        target,
        distance: guildTargetDistance(target.target, body.x, body.y),
      }))
      .filter((entry) => entry.distance < entry.target.target.range)
      .sort((a, b) => a.distance - b.distance)[0]?.target;
  }

  /**
   * Panel open beats everything, then Press E, then the idle line — and the
   * idle line now waits to be walked up to.
   *
   * The badge and the bubble are independent on purpose. The badge answers
   * "do I still owe this desk a conversation" and comes out of the save; the
   * bubble answers "what is the thing I am standing next to" and comes out of
   * the player's position. So a desk already dealt with still greets the
   * player when they come back past it, with no "!" over it.
   */
  private refreshHints(active: InteriorTarget | undefined, silent: boolean) {
    const top = this.cameras.main.scrollY + BUBBLE_SCREEN_MARGIN;
    const body = this.player.body;
    for (const target of this.targets) {
      if (silent) {
        target.hint.setVisible(false);
        continue;
      }
      target.hint.moveTo(
        target.target.bubble.x,
        Math.max(target.target.bubble.y, top),
      );
      const near =
        guildTargetDistance(target.target, body.x, body.y) < GUILD_BUBBLE_RANGE;
      // A near-only target — the stairway warp — still shows nothing at all
      // until it is the one an E would land on.
      target.hint.setVisible(
        target === active || (!target.target.nearOnly && near),
      );
      target.hint.setText(target === active ? PRESS_HINT : target.target.hint);
    }
  }

  /** The badges, re-derived from the save rather than from a scene flag. */
  private refreshQuestMarkers() {
    for (const target of this.targets)
      target.marker?.setVisible(!hasTalkedToGuildNpc(target.target.id));
  }

  update(_time: number, delta: number) {
    if (!this.controls) return;
    const locked = !this.controls.active;
    if (locked) {
      this.controls.reset();
      this.player.stop();
      this.refreshHints(undefined, true);
      return;
    }
    this.player.update(this.controls.movement(), delta);
    this.refreshQuestMarkers();
    this.refreshHints(this.nearestTarget(), false);
    this.travel.tryExit(this.player.body.x, this.player.body.y, () => {
      this.miss.hide();
      this.refreshHints(undefined, true);
    });
  }
}
