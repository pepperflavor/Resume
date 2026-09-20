import * as Phaser from 'phaser';
import {
  BOSS_CHASE,
  BOSS_FLOOR_TREASURE,
  BOSS_GLOWS,
  BOSS_WALL_TREASURE,
  BOSS_WARP,
  DUNGEON,
  DUNGEON_PROPS,
  DUNGEON_TREASURE,
  type DungeonPropConfig,
} from '@/game/config/dungeon';
import { NPC_FRAME_CONFIG } from '@/game/config/assets';
import { SCENE_KEYS, spawnPoint, type SceneEntry } from '@/game/config/scenes';
import { GOLDEN_CAT_TEXTURES } from '@/game/config/assets';
import { createBossChaseAnimations } from '@/game/animations/boss';
import {
  loadPlayerAssets,
  loadGoldenCatAssets,
} from '@/game/loaders/characters';
import { auditedProp, loadAuditedAtlas } from '@/game/objects/AuditedProps';
import {
  loadRuntimeAtlas,
  loadRuntimeGround,
  propFootprint,
  runtimeGlow,
  runtimeGround,
  runtimeProp,
} from '@/game/objects/RuntimeProps';
import { Player } from '@/game/objects/Player';
import { DungeonBoss } from '@/game/objects/DungeonBoss';
import { ExitSigns } from '@/game/objects/ExitSigns';
import { loadWarpAssets } from '@/game/objects/WarpCircle';
import { WarpPoint } from '@/game/objects/WarpPoint';
import { InteractionMissBubble } from '@/game/objects/InteractionMissBubble';
import { SceneControls } from '@/game/systems/SceneControls';
import { SceneTransition } from '@/game/systems/SceneTransition';
import type { CollisionRect, GameCallbacks } from '@/game/types';
export class DungeonBossScene extends Phaser.Scene {
  private player!: Player;
  private boss!: DungeonBoss;
  private travel!: SceneTransition;
  private controls!: SceneControls;
  private miss!: InteractionMissBubble;
  private statue!: Phaser.GameObjects.Image;
  private prompt!: Phaser.GameObjects.Text;
  private exitSigns!: ExitSigns;
  private warp!: WarpPoint;
  private dead = false;
  private entry: SceneEntry = {};
  constructor(private readonly callbacks: GameCallbacks) {
    super(SCENE_KEYS.dungeonBoss);
  }
  init(entry: SceneEntry = {}) {
    this.entry = entry;
  }
  preload() {
    loadPlayerAssets(this);
    loadGoldenCatAssets(this);
    loadAuditedAtlas(this, 'dungeon_tileset');
    loadRuntimeAtlas(this, 'bossTreasure');
    loadRuntimeAtlas(this, 'bossWallTreasure');
    loadRuntimeAtlas(this, 'bossFloorTreasure');
    loadRuntimeAtlas(this, 'bossGoldGlow');
    loadRuntimeGround(this, 'bossChamber');
    loadWarpAssets(this);
    if (!this.textures.exists('boss-dragon'))
      this.load.image('boss-dragon', '/assets/game/boss/boss_dragon.png');
    if (!this.textures.exists(BOSS_CHASE.key))
      this.load.spritesheet(BOSS_CHASE.key, BOSS_CHASE.url, {
        ...NPC_FRAME_CONFIG,
        frameWidth: BOSS_CHASE.frameWidth,
        frameHeight: BOSS_CHASE.frameHeight,
      });
  }
  create() {
    this.dead = false;
    this.add
      .rectangle(
        DUNGEON.width / 2,
        DUNGEON.height / 2,
        DUNGEON.width,
        DUNGEON.height,
        0x11141c,
      )
      .setDepth(0);
    runtimeGround(this, 'bossChamber', {
      x: 40,
      y: 36,
      width: DUNGEON.width - 80,
      height: DUNGEON.height - 72,
    });
    // Structures stop the boss as well as the player, bodies only stop the
    // player, and floor decoration blocks neither.
    const structures: CollisionRect[] = [],
      bodies: CollisionRect[] = [];
    const place = (
      p: DungeonPropConfig,
      draw: (config: DungeonPropConfig) => Phaser.GameObjects.Image,
    ) => {
      const prop = draw(p);
      if (p.flip) prop.setFlipX(true);
      if (p.flat) prop.setDepth(1);
      if (!p.footprint) return;
      const rect = propFootprint(p.x, p.y, p.footprint);
      if (p.collision === 'structure') structures.push(rect);
      if (p.collision !== 'floor') bodies.push(rect);
    };
    for (const p of DUNGEON_PROPS)
      place(p, (c) =>
        auditedProp(this, 'dungeon_tileset', c.name, c.x, c.y, c.scale),
      );
    for (const p of BOSS_WALL_TREASURE)
      place(p, (c) =>
        runtimeProp(this, 'bossWallTreasure', c.name, c.x, c.y, c.scale),
      );
    for (const p of BOSS_FLOOR_TREASURE)
      place(p, (c) =>
        runtimeProp(this, 'bossFloorTreasure', c.name, c.x, c.y, c.scale),
      );
    for (const p of DUNGEON_TREASURE)
      place(p, (c) =>
        runtimeProp(this, 'bossTreasure', c.name, c.x, c.y, c.scale),
      );
    for (const glow of BOSS_GLOWS)
      runtimeGlow(
        this,
        'bossGoldGlow',
        glow.name,
        glow.x,
        glow.y,
        glow.scale,
        glow.alpha,
      ).setDepth(glow.depth);
    // The rune pillar by the east passage. Its base blocks the player only:
    // the chase is free to run over it, as it is over every other body.
    this.exitSigns = new ExitSigns(this, 'dungeonBoss');
    const obstacles = [...bodies, ...this.exitSigns.collision()];
    this.statue = this.add
      .image(
        DUNGEON.statue.x,
        DUNGEON.statue.y - 62,
        GOLDEN_CAT_TEXTURES.world.key,
      )
      .setScale(0.3)
      .setOrigin(0.5, 1)
      .setDepth(DUNGEON.statue.y + 1)
      .setName('golden-cat-statue')
      .setVisible(!this.callbacks.hasGoldenCat());
    this.player = new Player(
      this,
      obstacles,
      spawnPoint('dungeonBoss', this.entry),
      DUNGEON,
    );
    this.cameras.main
      .setBounds(0, 0, DUNGEON.width, DUNGEON.height)
      // Boss Chamber is 1280x768 in a 768x384 viewport; a slightly wider camera
      // keeps the boss, the player and the statue readable in one frame.
      .setZoom(0.8)
      .startFollow(this.player.body, true, 0.15, 0.15);
    createBossChaseAnimations(this);
    this.boss = new DungeonBoss(this, structures);
    this.miss = new InteractionMissBubble(this, this.player.body);
    this.prompt = this.add
      .text(0, 0, 'Press E', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#151d29',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(1000)
      .setVisible(false);
    this.travel = new SceneTransition(this, this.player, 'dungeonBoss');
    this.warp = new WarpPoint(this, BOSS_WARP, this.travel);
    this.controls = new SceneControls(this, () => {
      if (this.dead || this.travel.locked || this.callbacks.isOverlayOpen())
        return;
      const body = this.player.body;
      if (this.warp.near(body.x, body.y)) {
        this.player.stop();
        this.controls.reset();
        this.miss.hide();
        this.prompt.setVisible(false);
        this.exitSigns.hide();
        this.warp.use();
        return;
      }
      const sign = this.nearestSign();
      if (sign) {
        this.miss.hide();
        this.player.stop();
        this.controls.reset();
        this.prompt.setVisible(false);
        this.callbacks.onInteract(sign.sign.dialogue);
        return;
      }
      const target = this.target();
      if (!target) {
        this.miss.show();
        return;
      }
      this.miss.hide();
      this.player.stop();
      this.controls.reset();
      this.prompt.setVisible(false);
      this.callbacks.onInteract('goldenCat', () => {
        if (this.dead || !this.scene.isActive()) return;
        this.callbacks.setGoldenCat(true);
        this.statue.setVisible(false);
      });
    });
    this.travel.enter(true);
    this.callbacks.onReady();
  }
  /** The marker loses to the statue, which is the reason to be in the room. */
  private nearestSign() {
    const p = this.player.body;
    if (this.target()) return undefined;
    return this.exitSigns.nearest(p.x, p.y);
  }

  private target() {
    const p = this.player.body;
    if (
      !this.callbacks.hasGoldenCat() &&
      Phaser.Math.Distance.Between(
        p.x,
        p.y,
        DUNGEON.statue.x,
        DUNGEON.statue.y,
      ) < 44
    )
      return 'statue';
    return null;
  }
  update(_time: number, delta: number) {
    if (!this.controls) return;
    if (
      this.dead ||
      this.travel.locked ||
      this.callbacks.isOverlayOpen() ||
      !this.controls.focused
    ) {
      this.player.stop();
      this.controls.reset();
      this.prompt.setVisible(false);
      this.exitSigns.hide();
      this.warp.hide();
      return;
    }
    const p = this.player.body,
      x = p.x,
      y = p.y;
    this.player.update(this.controls.movement(), delta);
    if (this.boss.update(delta, p, Math.hypot(p.x - x, p.y - y))) {
      this.dead = true;
      this.player.stop();
      this.miss.hide();
      this.prompt.setVisible(false);
      this.warp.hide();
      this.callbacks.onGameOver(() => {
        this.callbacks.setGoldenCat(false);
        this.travel.start(SCENE_KEYS.dungeonEntrance, { from: 'dungeonBoss' });
      });
      return;
    }
    this.warp.refresh(p.x, p.y);
    const onWarp = this.warp.near(p.x, p.y);
    const target = onWarp ? null : this.target(),
      point = DUNGEON.statue;
    this.prompt.setVisible(Boolean(target)).setPosition(point.x, point.y - 107);
    this.exitSigns.refresh(
      p.x,
      p.y,
      onWarp ? undefined : this.nearestSign()?.sign,
    );
  }
}
