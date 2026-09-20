import * as Phaser from 'phaser';
import {
  MARKET_KKOKKO,
  MARKET_NPCS,
  MARKET_OBJECTS,
  MARKET_NPC_KINDS,
  MARKET_TEXTURE,
  MARKET_WORLD,
  HINT_ROTATE_MS,
  NPC_INTERACTION_RANGE,
  foxHintLines,
  type MarketInteraction,
  type MarketNpc,
  type MarketObject,
} from '@/game/config/market';
import {
  MARKET_TERRAIN_TEXTURE,
  MARKET_TEXTURES,
  SHARED_SHEET_KEYS,
} from '@/game/config/marketAssets';
import { HOME_TEXTURES } from '@/game/config/homeAssets';
import { SCENE_KEYS, spawnPoint, type SceneEntry } from '@/game/config/scenes';
import { loadNpcAssets, loadPlayerAssets } from '@/game/loaders/characters';
import { AmbientNpc } from '@/game/objects/AmbientNpc';
import { HintBubble } from '@/game/objects/HintBubble';
import { InteractionMissBubble } from '@/game/objects/InteractionMissBubble';
import { Npc } from '@/game/objects/Npc';
import { Player, type Direction } from '@/game/objects/Player';
import { createMarketMap } from '@/game/objects/MarketMap';
import { ExitSigns } from '@/game/objects/ExitSigns';
import { getKkokkoQuest, getPlayerName } from '@/game/state/gameState';
import { insideZone } from '@/game/systems/collision';
import { SceneControls } from '@/game/systems/SceneControls';
import { SceneTransition } from '@/game/systems/SceneTransition';
import type { CollisionRect, GameCallbacks } from '@/game/types';

const PRESS_HINT = 'Press E';

// `npc` is optional so a future notice board or well can join the same list
// without the scene becoming NPC-only; a static target just carries x/y.
interface MarketTarget {
  id: string;
  interaction: MarketInteraction;
  x: number;
  y: number;
  range: number;
  hint: HintBubble;
  /** Idle lines, cycled on the scene clock. Most targets have exactly one. */
  hintLines: readonly string[];
  /** When set, the idle line only shows while the player stands inside it. */
  zone?: CollisionRect;
  approach?: { x: number; front: number; back: number };
  npc?: Npc;
  ambient?: AmbientNpc;
}

/** The scripted walk up to the well. */
interface Cinematic {
  target: { x: number; y: number };
  facing: Direction;
  phase: 'alignX' | 'moveY' | 'pause';
  elapsed: number;
  paused: number;
  then: 'marketWellClose';
}

/** Long enough for the walk, short enough that a blocked path still resolves. */
const CINEMATIC_TIMEOUT_MS = 1800;
const CINEMATIC_PAUSE_MS = 250;
const ARRIVE_EPSILON = 2;

const targetX = (target: MarketTarget) => target.npc?.sprite.x ?? target.x;
const targetY = (target: MarketTarget) => target.npc?.sprite.y ?? target.y;

export class MarketScene extends Phaser.Scene {
  private player!: Player;
  private miss!: InteractionMissBubble;
  private controls!: SceneControls;
  private travel!: SceneTransition;
  private ambient: AmbientNpc[] = [];
  private targets: MarketTarget[] = [];
  private exitSigns!: ExitSigns;
  private obstacles: CollisionRect[] = [];
  private entry: SceneEntry = {};
  private hintClock = 0;
  private questAtLastHint: string | null = null;
  private cinematic: Cinematic | null = null;

  constructor(private readonly callbacks: GameCallbacks) {
    super(SCENE_KEYS.market);
  }

  init(entry: SceneEntry = {}) {
    this.entry = entry;
    // Phaser reuses the Scene instance on return; never keep old sprite references.
    this.ambient = [];
    this.targets = [];
    this.obstacles = [];
    // Scene instances are reused, so every timing-ish bit of state resets here
    // rather than living in a timer that would survive a shutdown.
    this.hintClock = 0;
    this.questAtLastHint = null;
    this.cinematic = null;
  }

  preload() {
    loadPlayerAssets(this);
    loadNpcAssets(this, MARKET_NPC_KINDS);
    if (!this.textures.exists(MARKET_TEXTURE.key))
      this.load.image(MARKET_TEXTURE.key, MARKET_TEXTURE.url);
    if (!this.textures.exists(MARKET_TERRAIN_TEXTURE.key))
      this.load.image(MARKET_TERRAIN_TEXTURE.key, MARKET_TERRAIN_TEXTURE.url);
    for (const { key, url } of MARKET_TEXTURES)
      if (!this.textures.exists(key)) this.load.image(key, url);
    // Road and boundary planting are the sheets Home already audited.
    const shared: string[] = [
      SHARED_SHEET_KEYS.road,
      SHARED_SHEET_KEYS.trees,
      SHARED_SHEET_KEYS.natural1,
      SHARED_SHEET_KEYS.natural2,
    ];
    for (const { key, url } of HOME_TEXTURES)
      if (shared.includes(key) && !this.textures.exists(key))
        this.load.image(key, url);
  }

  /** Builds one NPC, its blocker, its wander behaviour and its hint bubble. */
  private addNpc(config: MarketNpc) {
    const npc = new Npc(this, config.kind, config.x, config.y, {
      scale: config.scale,
      mode: config.wanderArea ? 'animated' : 'stationary',
    });
    npc.sprite.setName(`market-npc-${config.id}`);
    if (config.blocks)
      this.obstacles.push({
        x: config.x - 10,
        y: config.y - 10,
        width: 20,
        height: 10,
      });
    const ambient = config.wanderArea
      ? new AmbientNpc(npc, config.wanderArea, this.obstacles)
      : undefined;
    if (ambient) this.ambient.push(ambient);
    const hint = new HintBubble(this, config.x, config.y - 52);
    hint.setText(config.hint);
    this.targets.push({
      id: config.id,
      interaction: config.interaction,
      x: config.x,
      y: config.y,
      range: NPC_INTERACTION_RANGE,
      hint,
      hintLines: [config.hint],
      npc,
      ambient,
    });
  }

  /** A static interactable such as the well: no sprite, no wandering. */
  private addObject(config: MarketObject) {
    const hint = new HintBubble(this, config.x, config.hintY);
    hint.setText(config.hint);
    this.targets.push({
      id: config.id,
      interaction: config.interaction,
      x: config.x,
      y: config.y,
      range: config.range,
      hint,
      hintLines: [config.hint],
      zone: config.zone,
      approach: config.approach,
    });
    if (config.zone) hint.setVisible(false);
  }

  create() {
    this.obstacles = createMarketMap(this);
    // Built before the NPCs and the player so its posts join the obstacle list.
    this.exitSigns = new ExitSigns(this, 'market');
    this.obstacles.push(...this.exitSigns.collision());

    for (const config of MARKET_NPCS) this.addNpc(config);
    for (const config of MARKET_OBJECTS) this.addObject(config);
    // Kkokko only lives here once she has been brought back.
    if (getKkokkoQuest() === 'COMPLETED') this.addNpc(MARKET_KKOKKO);

    this.player = new Player(
      this,
      this.obstacles,
      spawnPoint('market', this.entry),
      MARKET_WORLD,
    );

    // The world is larger than the viewport, so the camera trails the player
    // instead of showing the whole scene at once. No zoom change: sprites stay
    // exactly the size they are in Home and the Guild.
    const camera = this.cameras.main;
    camera.setBounds(0, 0, MARKET_WORLD.width, MARKET_WORLD.height);
    camera.setRoundPixels(true);
    camera.startFollow(this.player.body, true, 0.15, 0.15);

    this.miss = new InteractionMissBubble(this, this.player.body);
    this.travel = new SceneTransition(this, this.player, 'market');
    this.controls = new SceneControls(this, () => {
      if (
        this.cinematic ||
        this.travel.locked ||
        this.callbacks.isOverlayOpen()
      )
        return;
      const sign = this.nearestSign();
      if (sign) {
        this.miss.hide();
        this.player.stop();
        this.controls.reset();
        this.hideZonedHints();
        this.callbacks.onInteract(sign.sign.dialogue);
        return;
      }
      const target = this.nearestTarget();
      if (!target) {
        this.miss.show();
        return;
      }
      target.ambient?.beginInteraction();
      this.miss.hide();
      this.player.stop();
      this.controls.reset();
      if (target.interaction.type === 'projectShop') {
        this.callbacks.onOpenProjectShop();
        return;
      }
      if (target.interaction.confirm === 'approachWell') {
        this.callbacks.onInteract(target.interaction.dialogue, () =>
          this.beginApproach(target),
        );
        return;
      }
      this.callbacks.onInteract(target.interaction.dialogue);
    });
    this.travel.enter(Boolean(this.entry.from));
    this.callbacks.onReady();
  }

  /**
   * Walks the player up to the well before its second panel opens. Nothing is
   * teleported: the scene feeds the ordinary Player.update the same movement
   * input the keyboard would, so collision, walk animation and depth all work.
   */
  private beginApproach(target: MarketTarget) {
    const approach = target.approach;
    if (!approach) return;
    const body = this.player.body;
    // Approach from whichever side the player is already standing on.
    const fromBack = body.y < target.y;
    this.cinematic = {
      target: { x: approach.x, y: fromBack ? approach.back : approach.front },
      facing: fromBack ? 'down' : 'up',
      phase: 'alignX',
      elapsed: 0,
      paused: 0,
      then: 'marketWellClose',
    };
    target.hint.setVisible(false);
    this.miss.hide();
  }

  /** Two straight segments, x then y — no pathfinder, and it always terminates. */
  private advanceCinematic(delta: number) {
    const shot = this.cinematic;
    if (!shot) return;
    shot.elapsed += delta;
    const body = this.player.body;
    const none = { left: false, right: false, up: false, down: false };

    if (shot.phase === 'pause') {
      shot.paused += delta;
      if (shot.paused >= CINEMATIC_PAUSE_MS) this.endCinematic();
      return;
    }
    // A blocked path must not strand the player mid-scene.
    if (shot.elapsed >= CINEMATIC_TIMEOUT_MS) {
      this.arriveCinematic();
      return;
    }
    if (shot.phase === 'alignX') {
      const dx = shot.target.x - body.x;
      if (Math.abs(dx) <= ARRIVE_EPSILON) {
        shot.phase = 'moveY';
      } else {
        this.player.update({ ...none, left: dx < 0, right: dx > 0 }, delta);
        return;
      }
    }
    const dy = shot.target.y - body.y;
    if (Math.abs(dy) <= ARRIVE_EPSILON) {
      this.arriveCinematic();
      return;
    }
    this.player.update({ ...none, up: dy < 0, down: dy > 0 }, delta);
  }

  private arriveCinematic() {
    if (!this.cinematic) return;
    this.player.face(this.cinematic.facing);
    this.cinematic.phase = 'pause';
    this.cinematic.paused = 0;
  }

  private endCinematic() {
    const shot = this.cinematic;
    this.cinematic = null;
    if (shot) this.callbacks.onInteract(shot.then);
  }

  /** Idle lines rotate on the scene clock; the fox's depend on the quest. */
  private refreshHintLines() {
    const quest = getKkokkoQuest();
    if (this.questAtLastHint === quest) return;
    this.questAtLastHint = quest;
    const fox = this.targets.find((target) => target.id === 'fox');
    if (fox) fox.hintLines = foxHintLines(quest, getPlayerName());
  }

  /**
   * Priority, highest first: a panel or cinematic hides everything, then the
   * nearest target shows Press E, then a zoned target shows its idle line only
   * inside its zone. Anything else stays hidden.
   */
  private refreshHints(active: MarketTarget | undefined) {
    const body = this.player.body;
    const line = Math.floor(this.hintClock / HINT_ROTATE_MS);
    for (const target of this.targets) {
      if (target.npc)
        target.hint.moveTo(target.npc.sprite.x, target.npc.sprite.y - 52);
      const isActive = target === active;
      if (target.zone)
        target.hint.setVisible(
          isActive || insideZone(body.x, body.y, target.zone),
        );
      target.hint.setText(
        isActive
          ? PRESS_HINT
          : target.hintLines[line % target.hintLines.length],
      );
    }
  }

  /** Used while a panel or the cinematic owns the screen. */
  private hideZonedHints() {
    for (const target of this.targets)
      if (target.zone) target.hint.setVisible(false);
  }

  /**
   * A way-mark wins an E only when it is closer than every NPC and object, so
   * the sign by the street mouth can never fire alongside a shopkeeper.
   */
  private nearestSign() {
    const player = this.player.body;
    const sign = this.exitSigns.nearest(player.x, player.y);
    if (!sign) return undefined;
    const target = this.nearestTarget();
    if (!target) return sign;
    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      targetX(target),
      targetY(target),
    );
    return sign.distance < distance ? sign : undefined;
  }

  /** One winner only, so two targets can never fire from a single E. */
  private nearestTarget() {
    const player = this.player.body;
    return this.targets
      .map((target) => ({
        target,
        distance: Phaser.Math.Distance.Between(
          player.x,
          player.y,
          targetX(target),
          targetY(target),
        ),
      }))
      .filter((entry) => entry.distance < entry.target.range)
      .sort((a, b) => a.distance - b.distance)[0]?.target;
  }

  update(_time: number, delta: number) {
    if (!this.controls) return;
    this.hintClock += delta;
    this.refreshHintLines();
    // Finishing the quest at the fox's stall puts Kkokko in the square right
    // away, rather than only on the next visit.
    if (
      getKkokkoQuest() === 'COMPLETED' &&
      !this.targets.some((target) => target.id === MARKET_KKOKKO.id)
    )
      this.addNpc(MARKET_KKOKKO);

    // The cinematic owns the player: no keyboard, no interaction, no exits.
    if (this.cinematic) {
      for (const npc of this.ambient) npc.update(delta, true);
      this.controls.reset();
      this.hideZonedHints();
      this.exitSigns.hide();
      this.advanceCinematic(delta);
      return;
    }

    const locked =
      this.travel.locked ||
      this.callbacks.isOverlayOpen() ||
      !this.controls.focused;
    for (const npc of this.ambient) npc.update(delta, locked);
    if (locked) {
      this.controls.reset();
      this.player.stop();
      this.hideZonedHints();
      this.exitSigns.hide();
      return;
    }
    this.player.update(this.controls.movement(), delta);
    const sign = this.nearestSign();
    const active = sign ? undefined : this.nearestTarget();
    this.refreshHints(active);
    const body = this.player.body;
    this.exitSigns.refresh(body.x, body.y, sign?.sign);
    this.travel.tryExit(body.x, body.y, () => {
      this.miss.hide();
      this.exitSigns.hide();
    });
  }
}
