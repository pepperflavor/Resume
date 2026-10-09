import * as Phaser from 'phaser';
import {
  ENTRANCE,
  ENTRANCE_INTERACTION_RANGE,
  ENTRANCE_WARP,
  ENTRANCE_NPCS,
  ENTRANCE_SPIDERS,
  MERCHANT_ATLAS,
  RUG_LINES,
  RUG_SPEECH_DURATION,
  RUG_TRIGGER,
} from '@/game/config/entrance';
import { SCENE_KEYS, spawnPoint, type SceneEntry } from '@/game/config/scenes';
import { WORLD } from '@/game/config/world';
import type { DialogueId } from '@/game/config/dialogues';
import {
  loadPlayerAssets,
  loadNpcAssets,
  loadQuestMarkerAssets,
} from '@/game/loaders/characters';
import {
  QuestDirectionArrow,
  QuestExclamation,
  questMarkerBesideHead,
} from '@/game/objects/QuestMarker';
import { loadAuditedAtlas } from '@/game/objects/AuditedProps';
import {
  loadRuntimeAtlas,
  loadRuntimeGround,
} from '@/game/objects/RuntimeProps';
import { AmbientNpc } from '@/game/objects/AmbientNpc';
import { AmbientProp } from '@/game/objects/AmbientProp';
import { loadFlameAssets } from '@/game/objects/Flame';
import { loadWarpAssets } from '@/game/objects/WarpCircle';
import { WarpPoint } from '@/game/objects/WarpPoint';
import { createMerchantCamp } from '@/game/objects/MerchantCamp';
import { ExitSigns } from '@/game/objects/ExitSigns';
import { Npc } from '@/game/objects/Npc';
import { Player } from '@/game/objects/Player';
import { InteractionMissBubble } from '@/game/objects/InteractionMissBubble';
import { ZoneSpeech } from '@/game/objects/ZoneSpeech';
import { InputManager } from '@/game/input/InputManager';
import { configureSceneCamera } from '@/game/systems/SceneCamera';
import { SceneTransition } from '@/game/systems/SceneTransition';
import type { GameCallbacks } from '@/game/types';
import { setSceneBgm } from '@/game/state/audio';
import {
  canEnterDragonBoss,
  getProgress,
  hasGoldenCat,
  markMerchantGoldenCatTalked,
  markMerchantIntroTalked,
} from '@/game/state/gameState';

/**
 * Where this scene's Press E prompt floats above a talker's feet. The
 * merchant's badge is placed from it, so the two sit under one another instead
 * of on top of each other — see `questMarkerBesideHead`.
 *
 * He is the only talker here that carries a badge: the two campers by the fire
 * are flavour, and nothing in the quest line waits on them.
 */
const ENTRANCE_PROMPT_RISE = 56;

/**
 * The arrow at the northern passage, pointing up the stairs to the garden.
 * Below the stair mouth at y 96 and clear of the exit zone it points into, so
 * it is read on the approach rather than stood on.
 */
const GARDEN_ARROW = { x: 384, y: 134 } as const;
export class DungeonEntranceScene extends Phaser.Scene {
  private player!: Player;
  private merchant!: Npc;
  private controls!: InputManager;
  private travel!: SceneTransition;
  private miss!: InteractionMissBubble;
  private prompt!: Phaser.GameObjects.Text;
  private rugSpeech!: ZoneSpeech;
  private exitSigns!: ExitSigns;
  private warp!: WarpPoint;
  private merchantMarker!: QuestExclamation;
  private gardenArrow!: QuestDirectionArrow;
  private campers: { npc: Npc; dialogue: DialogueId }[] = [];
  private spiders: AmbientNpc[] = [];
  private entry: SceneEntry = {};
  constructor(private readonly callbacks: GameCallbacks) {
    super(SCENE_KEYS.dungeonEntrance);
  }
  init(entry: SceneEntry = {}) {
    this.entry = entry;
    // Phaser reuses the Scene instance on return; never keep old sprite references.
    this.campers = [];
    this.spiders = [];
  }
  preload() {
    loadPlayerAssets(this);
    loadNpcAssets(this, [
      'adventurerMerchant',
      ...ENTRANCE_NPCS.map((n) => n.kind),
    ]);
    loadQuestMarkerAssets(this);
    loadAuditedAtlas(this, 'dungeon_tileset');
    loadRuntimeAtlas(this, 'entranceAmbient');
    // One frame of it — the rune slab beside the boss board. The slab is the
    // chamber's own stone, and reading the rule on the chamber's own stone is
    // the point, so it is not re-cut from a cave sheet.
    loadRuntimeAtlas(this, 'bossTreasure');
    loadRuntimeAtlas(this, 'entranceRock');
    loadRuntimeAtlas(this, 'entranceGlow');
    loadRuntimeGround(this, 'entrance');
    loadFlameAssets(this);
    loadWarpAssets(this);
    if (!this.textures.exists(MERCHANT_ATLAS.key))
      this.load.image(MERCHANT_ATLAS.key, MERCHANT_ATLAS.url);
  }
  create() {
    setSceneBgm('dungeonEntrance');
    const obstacles = createMerchantCamp(this),
      m = ENTRANCE.merchant;
    // One torch stands before each of the three passages; their posts block.
    this.exitSigns = new ExitSigns(this, 'dungeonEntrance');
    obstacles.push(...this.exitSigns.collision());
    this.merchant = new Npc(this, 'adventurerMerchant', m.x, m.y, {
      scale: m.scale,
      mode: 'stationary',
    });
    this.merchant.sprite.setName('adventurer-merchant');
    const merchantBadge = questMarkerBesideHead(m.x, m.y, ENTRANCE_PROMPT_RISE);
    this.merchantMarker = new QuestExclamation(
      this,
      merchantBadge.x,
      merchantBadge.y,
      { name: 'merchant-quest-marker' },
    );
    // Guidance only — no collision, no trigger. The passage itself still does
    // all the travelling.
    this.gardenArrow = new QuestDirectionArrow(
      this,
      GARDEN_ARROW.x,
      GARDEN_ARROW.y,
      { facing: 'up', name: 'entrance-garden-arrow' },
    );
    for (const config of ENTRANCE_NPCS) {
      const npc = new Npc(this, config.kind, config.x, config.y, {
        scale: config.scale,
        facing: config.facing,
        mode: 'stationary',
      });
      npc.sprite.setName(`entrance-npc-${config.kind}`);
      this.campers.push({ npc, dialogue: config.dialogue });
      obstacles.push({
        x: config.x - 10,
        y: config.y - 10,
        width: 20,
        height: 10,
      });
    }
    for (const config of ENTRANCE_SPIDERS) {
      const prop = new AmbientProp(
        this,
        'entranceAmbient',
        config.name,
        config.x,
        config.y,
        config.scale,
      );
      this.spiders.push(new AmbientNpc(prop, config.area, obstacles));
    }
    this.player = new Player(
      this,
      obstacles,
      spawnPoint('dungeonEntrance', this.entry),
    );
    // The cave is exactly the desktop viewport, and the perimeter rock is drawn
    // past its edges on purpose: bounds keep anything outside off the screen.
    configureSceneCamera(this, this.player, WORLD);
    this.miss = new InteractionMissBubble(this, this.player.body);
    this.rugSpeech = new ZoneSpeech(
      this,
      this.merchant.sprite,
      RUG_TRIGGER,
      RUG_LINES,
      RUG_SPEECH_DURATION,
    );
    this.prompt = this.add
      .text(0, 0, 'Press E', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#fff',
        backgroundColor: '#151d29',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(1000)
      .setVisible(false);
    this.travel = new SceneTransition(this, this.player, 'dungeonEntrance');
    this.warp = new WarpPoint(this, ENTRANCE_WARP, this.travel);
    this.controls = new InputManager(
      this,
      () => {
        if (this.travel.locked || this.callbacks.isOverlayOpen()) return;
        // The circle beats everything it can reach: it is the only thing here
        // the player steps onto rather than walks up to.
        const body = this.player.body;
        if (this.warp.near(body.x, body.y)) {
          this.player.stop();
          this.controls.reset();
          this.miss.hide();
          this.prompt.setVisible(false);
          this.rugSpeech.hide();
          this.exitSigns.hide();
          // The circle still answers an E once the statue is gone — it says why
          // the way is shut. Going quiet instead would read as a broken warp.
          if (!canEnterDragonBoss()) {
            this.callbacks.onInteract('bossChamberSealed');
            return;
          }
          this.warp.use();
          return;
        }
        const sign = this.nearestSign();
        if (sign) {
          this.player.stop();
          this.controls.reset();
          this.miss.hide();
          this.prompt.setVisible(false);
          this.rugSpeech.hide();
          this.callbacks.onInteract(sign.sign.dialogue);
          return;
        }
        const target = this.target();
        if (!target) {
          this.miss.show();
          return;
        }
        this.player.stop();
        this.controls.reset();
        this.miss.hide();
        this.prompt.setVisible(false);
        this.rugSpeech.hide();
        if (target === 'merchant') {
          // Two separate briefings, two separate flags: the second one only
          // exists once the statue is in hand, and hearing it must not be
          // mistaken for having heard the first. Recorded as the panel opens,
          // the same point every other talker in the game records at.
          const withCat = hasGoldenCat();
          if (withCat) markMerchantGoldenCatTalked();
          else markMerchantIntroTalked();
          this.callbacks.onInteract(
            withCat ? 'merchantWithCat' : 'adventurerMerchant',
          );
        } else this.callbacks.onInteract(target.dialogue);
      },
      {
        isOverlayOpen: () => this.callbacks.isOverlayOpen(),
        isTravelLocked: () => this.travel.locked,
      },
    );
    this.refreshQuestMarkers();
    this.travel.enter(true);
    this.callbacks.onReady();
  }
  /**
   * The merchant's badge and the garden arrow, both re-derived from the save
   * every frame rather than decided once on entry.
   *
   * His "!" is up twice over a run: before his first briefing, and again once
   * the statue is in hand and he has a second thing to say about it. The arrow
   * follows that second conversation and goes out again the moment the statue
   * leaves the player's hands at the altar.
   */
  private refreshQuestMarkers() {
    const { merchantIntroTalked, merchantGoldenCatTalked } = getProgress();
    const carrying = hasGoldenCat();
    this.merchantMarker.setVisible(
      !merchantIntroTalked || (carrying && !merchantGoldenCatTalked),
    );
    this.gardenArrow.setVisible(carrying && merchantGoldenCatTalked);
  }

  /** A way-mark only wins an E when it is closer than every camper. */
  private nearestSign() {
    const p = this.player.body;
    const sign = this.exitSigns.nearest(p.x, p.y);
    if (!sign) return undefined;
    const target = this.target();
    if (!target) return sign;
    const point = this.promptPoint(target);
    const distance = Phaser.Math.Distance.Between(p.x, p.y, point.x, point.y);
    return sign.distance < distance ? sign : undefined;
  }

  private target() {
    const p = this.player.body,
      m = this.merchant.sprite;
    if (
      Phaser.Math.Distance.Between(p.x, p.y, m.x, m.y) <
      ENTRANCE_INTERACTION_RANGE
    )
      return 'merchant';
    // Rabbit and cat now sit either side of one fire, so the nearest of the two
    // wins outright: a single E can never open both.
    return this.campers
      .map((camper) => ({
        ...camper,
        distance: Phaser.Math.Distance.Between(
          p.x,
          p.y,
          camper.npc.sprite.x,
          camper.npc.sprite.y,
        ),
      }))
      .filter((camper) => camper.distance < ENTRANCE_INTERACTION_RANGE)
      .sort((a, b) => a.distance - b.distance)[0];
  }
  private promptPoint(target: NonNullable<ReturnType<typeof this.target>>) {
    if (target === 'merchant') return this.merchant.sprite;
    return target.npc.sprite;
  }
  update(_time: number, delta: number) {
    if (!this.controls) return;
    const locked = !this.controls.active;
    for (const spider of this.spiders) spider.update(delta, locked);
    this.rugSpeech.update(
      this.player.body.x,
      this.player.body.y,
      delta,
      locked,
    );
    if (locked) {
      this.player.stop();
      this.controls.reset();
      this.prompt.setVisible(false);
      this.exitSigns.hide();
      this.warp.hide();
      return;
    }
    this.player.update(this.controls.movement(), delta);
    this.refreshQuestMarkers();
    const p = this.player.body;
    this.warp.refresh(p.x, p.y);
    const onWarp = this.warp.near(p.x, p.y);
    const sign = onWarp ? undefined : this.nearestSign();
    this.exitSigns.refresh(p.x, p.y, sign?.sign);
    const target = sign || onWarp ? undefined : this.target();
    this.prompt.setVisible(Boolean(target));
    if (target) {
      const point = this.promptPoint(target);
      this.prompt.setPosition(point.x, point.y - ENTRANCE_PROMPT_RISE);
    }
    this.travel.tryExit(p.x, p.y, () => {
      this.miss.hide();
      this.rugSpeech.hide();
      this.prompt.setVisible(false);
      this.exitSigns.hide();
      this.warp.hide();
    });
  }
}
