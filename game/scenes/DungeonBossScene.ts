import * as Phaser from 'phaser';
import {
  BOSS_FLOOR_TREASURE,
  BOSS_GLOWS,
  BOSS_WALL_TREASURE,
  BOSS_WARP,
  DUNGEON,
  DUNGEON_PROPS,
  DUNGEON_TREASURE,
  type DungeonPropConfig,
} from '@/game/config/dungeon';
import {
  DRAGON_AUDIO,
  DRAGON_BODY,
  DRAGON_DETECTION,
  DRAGON_ESCAPE,
  DRAGON_MOVE_EPSILON,
  DRAGON_SNORE_SFX,
  DRAGON_SUCCESS,
  DRAGON_SUCCESS_CUTSCENE,
  DRAGON_TEXTURES,
  type DragonFailure,
  type DragonState,
} from '@/game/config/bossDragon';
import { SCENE_KEYS, spawnPoint, type SceneEntry } from '@/game/config/scenes';
import { GOLDEN_CAT_TEXTURES } from '@/game/config/assets';
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
import {
  SleepingDragon,
  loadDragonAssets,
} from '@/game/objects/SleepingDragon';
import { ExitSigns } from '@/game/objects/ExitSigns';
import { loadWarpAssets } from '@/game/objects/WarpCircle';
import { WarpPoint } from '@/game/objects/WarpPoint';
import { InteractionMissBubble } from '@/game/objects/InteractionMissBubble';
import { InputManager } from '@/game/input/InputManager';
import { configureSceneCamera } from '@/game/systems/SceneCamera';
import { SceneTransition } from '@/game/systems/SceneTransition';
import { DragonSnoreCycle } from '@/game/systems/DragonSnoreCycle';
import {
  SFX,
  playSfx,
  preloadSfx,
  rampBgm,
  setSceneBgm,
  stopSfx,
} from '@/game/state/audio';
import { isDragonBossCleared, takeGoldenCat } from '@/game/state/gameState';
import type { CollisionRect, GameCallbacks } from '@/game/types';
export class DungeonBossScene extends Phaser.Scene {
  private player!: Player;
  private dragon!: SleepingDragon;
  private travel!: SceneTransition;
  private controls!: InputManager;
  private miss!: InteractionMissBubble;
  private statue!: Phaser.GameObjects.Image;
  private prompt!: Phaser.GameObjects.Text;
  private exitSigns!: ExitSigns;
  private warp!: WarpPoint;
  /** One source of truth for the whole encounter. */
  private state: DragonState = 'intro';
  private failure?: DragonFailure;
  /** The sleep cycle, clocked by the snore audio rather than by a timer. */
  private cycle!: DragonSnoreCycle;
  private wake: HTMLAudioElement | null = null;
  /** Whichever sting the encounter ended on, so leaving can silence it. */
  private sting: HTMLAudioElement | null = null;
  private lastPosition = new Phaser.Math.Vector2();
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
    loadDragonAssets(this);
    // Fetched with the art, not on the first snore: the cycle is only honest
    // if the sound starts when the dragon does.
    preloadSfx([
      ...DRAGON_SNORE_SFX,
      SFX.dragonWake,
      SFX.goldenCatSuccess,
      SFX.goldenCatFailure,
    ]);
  }
  create() {
    this.state = 'intro';
    this.failure = undefined;
    this.wake = null;
    this.sting = null;
    setSceneBgm('dungeonBoss');
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
    // Nothing chases the player any more, so a prop either stops them or it is
    // decoration; the old structure/body split had only the chase to serve.
    const bodies: CollisionRect[] = [];
    const place = (
      p: DungeonPropConfig,
      draw: (config: DungeonPropConfig) => Phaser.GameObjects.Image,
    ) => {
      const prop = draw(p);
      if (p.flip) prop.setFlipX(true);
      if (p.flat) prop.setDepth(1);
      if (!p.footprint) return;
      if (p.collision === 'floor') return;
      bodies.push(propFootprint(p.x, p.y, p.footprint));
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
    // The dragon is deliberately absent from this list. Its body is not a wall
    // to be stopped by, it is a thing that wakes: the player walks into it and
    // the scene ends the run, which is why contact is checked in update().
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
      .setVisible(!isDragonBossCleared());
    this.player = new Player(
      this,
      obstacles,
      spawnPoint('dungeonBoss', this.entry),
      DUNGEON,
    );
    // Boss Chamber is 1280x768 in a 768x384 desktop viewport; a slightly wider
    // camera keeps the boss, the player and the statue readable in one frame.
    configureSceneCamera(this, this.player, DUNGEON, { desktopZoom: 0.8 });
    this.dragon = new SleepingDragon(this);
    this.lastPosition.set(this.player.body.x, this.player.body.y);
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
    this.controls = new InputManager(
      this,
      () => {
        if (
          this.settled ||
          this.travel.locked ||
          this.callbacks.isOverlayOpen()
        )
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
        // Picking 가져간다 closes the panel and calls this; 그냥 둔다 and Esc
        // close it and call nothing, so the room simply carries on.
        this.callbacks.onInteract('goldenCat', () => {
          if (!this.scene.isActive()) return;
          this.succeed();
        });
      },
      {
        isOverlayOpen: () => this.callbacks.isOverlayOpen(),
        isTravelLocked: () => this.travel.locked,
      },
    );
    this.cycle = new DragonSnoreCycle(this, (phase) => {
      if (this.settled) return;
      this.state = phase;
      this.dragon.setSnoring(phase === 'snoring');
    });
    // Leaving by any door — the warp, a failure, a React unmount — takes the
    // room's sound with it. Nothing may snore into the Dungeon Entrance.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cycle.stop();
      stopSfx(this.wake);
      this.wake = null;
      stopSfx(this.sting);
      this.sting = null;
    });
    // Started on the first frame the player is actually in control, not here:
    // the entry fade would otherwise eat the front of the first snore.
    this.travel.enter(true);
    this.callbacks.onReady();
  }

  /**
   * The run has an outcome and nothing can change it now: the dragon woke, or
   * the statue is off its pedestal. Both endings play themselves out on the
   * scene's own timers, so this takes the room away from the player without
   * ever stopping the scene — an earlier version folded success in with the
   * player's lock and left the room with no way out of it.
   */
  private get settled() {
    return (
      this.state === 'alert' ||
      this.state === 'failed' ||
      this.state === 'success'
    );
  }

  /** Every beat where the player has stopped being in control of the room. */
  private get playerInputLocked() {
    return this.settled || !this.controls.active;
  }

  /**
   * The sleep cycle is being played, so it can still be lost. Once it is not,
   * neither a step nor a stumble into the dragon means anything.
   */
  private get bossGameplayActive() {
    return this.state === 'snoring' || this.state === 'silent';
  }

  /** The body segments, exposed so they can be drawn and checked at runtime. */
  readonly dragonBody = DRAGON_BODY;

  /**
   * Paints the body segments over the dragon. Nothing calls this in play; it
   * is how the collision was checked against the art and how it can be checked
   * again after the sprite changes.
   */
  debugCollision(visible = true) {
    const name = 'dragon-collision-debug';
    this.children.getByName(name)?.destroy();
    if (!visible) return;
    const graphics = this.add.graphics().setName(name).setDepth(1900);
    graphics.fillStyle(0xff3366, 0.32).lineStyle(1, 0xff88aa, 0.8);
    for (const r of this.dragonBody) {
      graphics.fillRect(r.x, r.y, r.width, r.height);
      graphics.strokeRect(r.x, r.y, r.width, r.height);
    }
  }

  /** Contact is judged on the foot box, the same shape walls are judged on. */
  private touchingDragon(x: number, y: number) {
    return DRAGON_BODY.some(
      (r) =>
        x + 8 > r.x &&
        x - 8 < r.x + r.width &&
        y > r.y &&
        y - 8 < r.y + r.height,
    );
  }

  /**
   * The statue is in the player's arms, and that ends the encounter on the
   * spot: the cycle stops before the next snore can be queued, and with the
   * state no longer a playing one neither a step nor the dragon's own body
   * means anything. What follows is three drawn panels and the walk home.
   */
  private succeed() {
    if (this.settled) return;
    this.state = 'success';
    this.cycle.stop();
    this.dragon.setSnoring(false);
    this.player.stop();
    this.controls.reset();
    this.miss.hide();
    this.prompt.setVisible(false);
    this.exitSigns.hide();
    this.warp.hide();
    this.statue.setVisible(false);
    // One write says both things: the player is carrying it, and this room
    // has been robbed. The HUD and the sealed door read the same value.
    takeGoldenCat();
    this.showSuccess();
  }

  /**
   * Three panels cut from one strip, each drawn at full size in the middle of
   * the screen. Shrinking the whole strip to fit would make three thumbnails
   * of a story that has to be read one beat at a time.
   */
  private showSuccess() {
    // On the frame the first panel appears, and only here: `succeed` is the
    // encounter's one-way door, so this runs once per success with no flag of
    // its own. The sting is 3.8s against 4.1s of panels, which is the way round
    // it should be — the music finishes under the picture, not over the door.
    this.sting = playSfx(SFX.goldenCatSuccess, DRAGON_AUDIO.goldenCatSting);
    const { view, centre } = this.pinCamera();
    this.add
      .rectangle(
        centre.x,
        centre.y,
        view.width * 1.4,
        view.height * 1.4,
        0x05070b,
      )
      .setAlpha(DRAGON_SUCCESS_CUTSCENE.backdropAlpha)
      .setDepth(2000)
      .setName('success-backdrop');
    const panel = this.add
      .image(centre.x, centre.y, DRAGON_SUCCESS.key, 0)
      .setDepth(2001)
      .setName('success-cutscene')
      .setAlpha(0);
    panel.setScale(
      Math.min(view.width / panel.width, view.height / panel.height),
    );
    this.playPanel(panel, 0);
  }

  /** One panel, then the next, then the door. */
  private playPanel(panel: Phaser.GameObjects.Image, index: number) {
    if (!this.scene.isActive()) return;
    const { holds, fade, bgmFade } = DRAGON_SUCCESS_CUTSCENE;
    const last = index >= DRAGON_SUCCESS.panels - 1;
    panel.setFrame(index);
    this.tweens.add({ targets: panel, alpha: 1, duration: fade });
    // The music leaves under the last panel instead of being cut at the door.
    if (last) rampBgm(0, bgmFade);
    this.time.delayedCall(holds[index] ?? holds[holds.length - 1], () => {
      if (!this.scene.isActive()) return;
      if (last) {
        this.travel.start(SCENE_KEYS.dungeonEntrance, { from: 'dungeonBoss' });
        return;
      }
      this.tweens.add({
        targets: panel,
        alpha: 0,
        duration: fade,
        onComplete: () => this.playPanel(panel, index + 1),
      });
    });
  }

  /**
   * Pins the camera and answers where the middle of the screen will actually
   * be. The camera lerps toward the player, and Phaser clamps its scroll to
   * the room at render time, so neither the live scroll nor the player's own
   * position is where a full-screen overlay belongs. Both cutscenes ask this.
   */
  private pinCamera() {
    const camera = this.cameras.main;
    camera.stopFollow();
    const view = {
      width: camera.width / camera.zoom,
      height: camera.height / camera.zoom,
    };
    const bounds = camera.getBounds();
    const centre = {
      x: Phaser.Math.Clamp(
        this.player.body.x,
        bounds.x + view.width / 2,
        bounds.right - view.width / 2,
      ),
      y: Phaser.Math.Clamp(
        this.player.body.y,
        bounds.y + view.height / 2,
        bounds.bottom - view.height / 2,
      ),
    };
    camera.centerOn(centre.x, centre.y);
    return { view, centre };
  }

  /**
   * The one way a run ends badly, whichever mistake got there. Both reasons
   * arrive here, and `locked` makes it a one-shot: a step into the dragon on
   * the same frame the silence caught the player cannot wake it twice.
   *
   * What follows is three separate beats rather than one cut, because the
   * player has to read them in order — I slipped, it woke, I am out.
   */
  private fail(reason: DragonFailure) {
    if (this.settled) return;
    this.failure = reason;
    this.state = 'alert';
    // Silence first: the cycle stops dead, so the snore that was already
    // queued behind this one never arrives over the top of the wake.
    this.cycle.stop();
    this.player.stop();
    this.controls.reset();
    this.miss.hide();
    this.prompt.setVisible(false);
    this.exitSigns.hide();
    this.warp.hide();
    // The music gets out of the way of what is about to happen.
    rampBgm(DRAGON_DETECTION.duck.level, DRAGON_DETECTION.duck.ms);
    // Beat one is nothing at all: the dragon is still asleep and the player is
    // already stopped. It is the "...uh oh" that makes the wake land.
    this.time.delayedCall(DRAGON_DETECTION.freeze, () => {
      if (!this.scene.isActive()) return;
      this.dragon.wake();
      this.wake = playSfx(SFX.dragonWake, DRAGON_AUDIO.wake);
      this.cameras.main.shake(
        DRAGON_DETECTION.shake.duration,
        DRAGON_DETECTION.shake.intensity,
      );
    });
    this.time.delayedCall(
      DRAGON_DETECTION.freeze + DRAGON_DETECTION.alertHold,
      () => {
        if (!this.scene.isActive()) return;
        this.state = 'failed';
        this.showEscape();
      },
    );
  }

  /** The escape illustration, fitted inside the viewport without distortion. */
  private showEscape() {
    // With the illustration, not with the mistake: the wake roar has had its
    // beat and this is the toon starting. One call, one play — the delayed
    // call that reaches here fires once per attempt, so a retry stings again
    // without anything remembering the last one.
    this.sting = playSfx(SFX.goldenCatFailure, DRAGON_AUDIO.goldenCatSting);
    rampBgm(DRAGON_DETECTION.fade.level, DRAGON_DETECTION.fade.ms);
    const { view, centre } = this.pinCamera();
    this.add
      // Oversized on purpose: nothing of the room should peek past its edge.
      .rectangle(
        centre.x,
        centre.y,
        view.width * 1.4,
        view.height * 1.4,
        0x05070b,
      )
      .setAlpha(DRAGON_ESCAPE.backdropAlpha)
      .setDepth(2000)
      .setName('escape-backdrop');
    const image = this.add
      .image(centre.x, centre.y, DRAGON_TEXTURES.escape.key)
      .setDepth(2001)
      .setName('escape-cutscene');
    image.setScale(
      Math.min(view.width / image.width, view.height / image.height),
    );
    this.time.delayedCall(DRAGON_DETECTION.cutscene, () => {
      if (!this.scene.isActive()) return;
      // A failure comes home by its own door, so the entrance can tell the two
      // arrivals apart without a second spawn table.
      this.travel.start(SCENE_KEYS.dungeonEntrance, { from: 'dungeonBoss' });
    });
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
      !isDragonBossCleared() &&
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
    if (this.playerInputLocked) {
      this.player.stop();
      this.controls.reset();
      this.prompt.setVisible(false);
      this.exitSigns.hide();
      this.warp.hide();
      // The cycle only runs while the player can act on it, so a dialogue or
      // a lost window never burns a silence the player could not react to.
      // The snore is held mid-file too: the sound the player is judged on must
      // not play on behind a rune hint they are reading.
      this.cycle.setPaused(true);
      this.lastPosition.set(this.player.body.x, this.player.body.y);
      return;
    }
    if (this.state === 'intro') this.cycle.start();
    this.cycle.setPaused(false);
    this.cycle.update(delta);
    this.player.update(this.controls.movement(), delta);
    const p = this.player.body;

    // Touching the dragon ends the run whatever it is doing: snoring is cover
    // for footsteps, not permission to climb over it.
    if (this.bossGameplayActive && this.touchingDragon(p.x, p.y)) {
      this.fail('touched-dragon');
      return;
    }
    const travelled = Phaser.Math.Distance.Between(
      this.lastPosition.x,
      this.lastPosition.y,
      p.x,
      p.y,
    );
    this.lastPosition.set(p.x, p.y);
    if (
      this.bossGameplayActive &&
      this.cycle.phase === 'silent' &&
      this.cycle.grace <= 0 &&
      travelled > DRAGON_MOVE_EPSILON
    ) {
      this.fail('moved-during-silence');
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
