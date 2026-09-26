import * as Phaser from 'phaser';
import {
  FRONT_DEPTH,
  GUILD_FLOOR_ACCESS,
  GUILD_FLOOR_TARGETS,
  GUILD_INTERIOR_COLLISION,
  GUILD_INTERIOR_NPCS,
  GUILD_INTERIOR_SIGNS,
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
import { loadPlayerAssets } from '@/game/loaders/characters';
import { guildInteriorScenery } from '@/game/objects/guildInteriorScenery';
import { HintBubble } from '@/game/objects/HintBubble';
import { WarpCircle, loadWarpAssets } from '@/game/objects/WarpCircle';
import { InteractionMissBubble } from '@/game/objects/InteractionMissBubble';
import { Player } from '@/game/objects/Player';
import { SceneControls } from '@/game/systems/SceneControls';
import { SceneTransition } from '@/game/systems/SceneTransition';
import type { CollisionRect, GameCallbacks } from '@/game/types';
import { setSceneBgm } from '@/game/state/audio';

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

interface InteriorTarget {
  target: GuildTarget;
  hint: HintBubble;
}

export class GuildInteriorScene extends Phaser.Scene {
  private player!: Player;
  private miss!: InteractionMissBubble;
  private controls!: SceneControls;
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
    for (const sign of GUILD_INTERIOR_SIGNS.filter((board) => board.label)) {
      const panel = signPanel(sign);
      const label = this.add
        .text(panel.x, panel.y, sign.label, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#4a3a24',
        })
        .setOrigin(0.5)
        .setDepth(SIGN_TEXT_DEPTH);
      // Shrink to the panel rather than trusting one font size to fit both,
      // and keep a margin so the longer name never kisses the board's border.
      const room = 1 - SIGN_TEXT_MARGIN * 2;
      label.setScale(
        Math.min(
          1,
          (panel.width * room) / label.width,
          (panel.height * room) / label.height,
        ),
      );
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

    // Same camera contract as Market: bounds plus follow, zoom untouched.
    const camera = this.cameras.main;
    camera.setBounds(
      0,
      0,
      GUILD_INTERIOR_WORLD.width,
      GUILD_INTERIOR_WORLD.height,
    );
    camera.setRoundPixels(true);
    camera.startFollow(this.player.body, true, 0.15, 0.15);

    new WarpCircle(this, {
      x: GUILD_WARP.x,
      y: GUILD_WARP.y,
      width: GUILD_WARP.width,
      glowAlpha: GUILD_WARP.glowAlpha,
      depth: GUILD_WARP.depth,
    });
    this.miss = new InteractionMissBubble(this, this.player.body);
    this.travel = new SceneTransition(this, this.player, 'guildInterior');
    this.controls = new SceneControls(this, () => {
      if (this.travel.locked || this.callbacks.isOverlayOpen()) return;
      const target = this.nearestTarget();
      if (!target) {
        this.miss.show();
        return;
      }
      this.miss.hide();
      this.player.stop();
      this.controls.reset();
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
    });
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
    hint.setVisible(!target.nearOnly);
    this.targets.push({ target, hint });
  }

  /** One winner only, so a single E can never fire two desks at once. */
  private nearestTarget() {
    const body = this.player.body;
    return this.targets
      .map((target) => ({
        target,
        distance: Phaser.Math.Distance.Between(
          body.x,
          body.y,
          target.target.anchor.x,
          target.target.anchor.y,
        ),
      }))
      .filter((entry) => entry.distance < entry.target.target.range)
      .sort((a, b) => a.distance - b.distance)[0]?.target;
  }

  /** Panel open beats everything, then Press E, then the idle line. */
  private refreshHints(active: InteriorTarget | undefined, silent: boolean) {
    const top = this.cameras.main.scrollY + BUBBLE_SCREEN_MARGIN;
    for (const target of this.targets) {
      if (silent) {
        target.hint.setVisible(false);
        continue;
      }
      target.hint.moveTo(
        target.target.bubble.x,
        Math.max(target.target.bubble.y, top),
      );
      // A near-only target — the stairways — shows nothing until it is the one
      // an E would land on.
      target.hint.setVisible(!target.target.nearOnly || target === active);
      target.hint.setText(target === active ? PRESS_HINT : target.target.hint);
    }
  }

  update(_time: number, delta: number) {
    if (!this.controls) return;
    const locked =
      this.travel.locked ||
      this.callbacks.isOverlayOpen() ||
      !this.controls.focused;
    if (locked) {
      this.controls.reset();
      this.player.stop();
      this.refreshHints(undefined, true);
      return;
    }
    this.player.update(this.controls.movement(), delta);
    this.refreshHints(this.nearestTarget(), false);
    this.travel.tryExit(this.player.body.x, this.player.body.y, () => {
      this.miss.hide();
      this.refreshHints(undefined, true);
    });
  }
}
