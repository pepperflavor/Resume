import * as Phaser from 'phaser';
import {
  ALTAR_ALERT,
  FAIRY_PROMPT_RISE,
  GARDEN,
  GARDEN_AMBIENCE,
} from '@/game/config/garden';
import { GOLDEN_CAT_TEXTURES } from '@/game/config/assets';
import { SCENE_KEYS, spawnPoint, type SceneEntry } from '@/game/config/scenes';
import { WORLD } from '@/game/config/world';
import type { DialogueId } from '@/game/config/dialogues';
import {
  loadGoldenCatAssets,
  loadNpcAssets,
  loadPlayerAssets,
  loadQuestMarkerAssets,
} from '@/game/loaders/characters';
import {
  QuestExclamation,
  questMarkerBesideHead,
} from '@/game/objects/QuestMarker';
import { createCaveGardenMap } from '@/game/objects/CaveGardenMap';
import { ExitSigns } from '@/game/objects/ExitSigns';
import {
  loadRuntimeAtlas,
  loadRuntimeGround,
} from '@/game/objects/RuntimeProps';
import { InteractionMissBubble } from '@/game/objects/InteractionMissBubble';
import { Npc } from '@/game/objects/Npc';
import { Player } from '@/game/objects/Player';
import { InputManager } from '@/game/input/InputManager';
import { configureSceneCamera } from '@/game/systems/SceneCamera';
import { SceneTransition } from '@/game/systems/SceneTransition';
import type { GameCallbacks } from '@/game/types';
import { preloadSfx, setSceneBgm } from '@/game/state/audio';
import { CaveGardenAmbience } from '@/game/systems/CaveGardenAmbience';
import {
  getProgress,
  hasGoldenCat,
  hasOfferedGoldenCat,
  markFairyAskedForOffering,
  markFairyQuestCompleted,
  offerGoldenCat,
} from '@/game/state/gameState';

export class CaveGardenScene extends Phaser.Scene {
  private player!: Player;
  private fairy!: Npc;
  private altar!: Phaser.GameObjects.Image;
  private offering!: Phaser.GameObjects.Image;
  private fairyMarker!: QuestExclamation;
  private altarMarker!: QuestExclamation;
  private controls!: InputManager;
  private travel!: SceneTransition;
  private miss!: InteractionMissBubble;
  private prompt!: Phaser.GameObjects.Text;
  private exitSigns!: ExitSigns;
  /** The grotto's dripping, which belongs to this scene and leaves with it. */
  private ambience!: CaveGardenAmbience;
  private entry: SceneEntry = {};
  constructor(private readonly callbacks: GameCallbacks) {
    super(SCENE_KEYS.caveGarden);
  }
  init(entry: SceneEntry = {}) {
    this.entry = entry;
  }
  preload() {
    loadPlayerAssets(this);
    loadNpcAssets(this, ['pondFairy']);
    loadGoldenCatAssets(this);
    loadQuestMarkerAssets(this);
    preloadSfx(GARDEN_AMBIENCE.drops.map((drop) => drop.url));
    loadRuntimeAtlas(this, 'gardenOffering');
    loadRuntimeAtlas(this, 'gardenWater');
    loadRuntimeAtlas(this, 'gardenPondEdge');
    loadRuntimeAtlas(this, 'gardenEnvironment');
    loadRuntimeAtlas(this, 'gardenLight');
    loadRuntimeAtlas(this, 'gardenLightShaft');
    loadRuntimeGround(this, 'caveGarden');
  }
  create() {
    setSceneBgm('caveGarden');
    const { obstacles, altar } = createCaveGardenMap(this);
    // The rune marker before the south passage; its base blocks.
    this.exitSigns = new ExitSigns(this, 'caveGarden');
    obstacles.push(...this.exitSigns.collision());
    this.altar = altar;
    this.fairy = new Npc(this, 'pondFairy', GARDEN.fairy.x, GARDEN.fairy.y, {
      scale: GARDEN.fairy.scale,
      facing: 'left',
      mode: 'stationary',
    });
    this.fairy.sprite.setName('pond-fairy');
    this.tweens.add({
      targets: this.fairy.sprite,
      y: GARDEN.fairy.y - GARDEN.fairyFloat.amplitude,
      duration: GARDEN.fairyFloat.duration,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.tweens.killTweensOf(this.fairy.sprite),
    );
    // The shared, still "!" in place of the bespoke bobbing badge this scene
    // used to carry. Visibility for both is decided in `refreshQuestMarkers`,
    // which reads the save rather than whatever happened on this visit.
    const fairyBadge = questMarkerBesideHead(
      GARDEN.fairy.x,
      GARDEN.fairy.y,
      FAIRY_PROMPT_RISE,
    );
    this.fairyMarker = new QuestExclamation(this, fairyBadge.x, fairyBadge.y, {
      name: 'fairy-quest-marker',
    });
    this.altarMarker = new QuestExclamation(
      this,
      GARDEN.altar.x + ALTAR_ALERT.offsetX,
      GARDEN.altar.y + ALTAR_ALERT.offsetY,
      { name: 'altar-quest-marker' },
    );
    this.ambience = new CaveGardenAmbience(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.ambience.stop());
    this.ambience.start();
    obstacles.push({
      x: GARDEN.fairy.x - 10,
      y: GARDEN.fairy.y - 10,
      width: 20,
      height: 10,
    });
    this.offering = this.add
      .image(
        GARDEN.altarTop.x,
        GARDEN.altarTop.y,
        GOLDEN_CAT_TEXTURES.world.key,
      )
      .setScale(0.3)
      .setOrigin(0.5, 1)
      .setDepth(GARDEN.altar.y + 1)
      .setName('golden-cat-offering')
      .setVisible(hasOfferedGoldenCat());
    this.player = new Player(
      this,
      obstacles,
      spawnPoint('caveGarden', this.entry),
    );
    // The grotto is exactly the desktop viewport, and the perimeter planting is
    // drawn past its edges on purpose: bounds keep anything outside off screen.
    configureSceneCamera(this, this.player, WORLD);
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
    this.travel = new SceneTransition(this, this.player, 'caveGarden');
    this.controls = new InputManager(
      this,
      () => {
        if (this.travel.locked || this.callbacks.isOverlayOpen()) return;
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
        if (target === 'fairy') {
          // Recorded as her panel opens, the same point every other talker
          // records at. Her two beats are kept apart: asking for the offering
          // moves the badge to the altar, and the closing conversation — the
          // one that hands over the ending — takes it off her for good.
          if (hasOfferedGoldenCat()) markFairyQuestCompleted();
          else if (hasGoldenCat()) markFairyAskedForOffering();
          this.callbacks.onInteract(this.fairyDialogue());
          return;
        }
        if (hasGoldenCat())
          this.callbacks.onInteract('offeringAltarWithCat', () => {
            if (!this.scene.isActive()) return;
            offerGoldenCat();
            this.offering.setVisible(true);
            // `refreshQuestMarkers` picks the hand-over up on the next frame:
            // the altar's badge goes out and the fairy's comes back, because
            // the thing left to do is now to go and tell her.
            this.refreshQuestMarkers();
          });
        else
          this.callbacks.onInteract(
            hasOfferedGoldenCat() ? 'offeringAltarDone' : 'offeringAltar',
          );
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
   * Whose turn it is, in one place.
   *
   * The statue's road through this grotto is a hand-off between two things:
   * carrying it means the fairy has something to say, having been told where
   * it goes means the altar does, and having set it down means she does again
   * — until her closing conversation, after which neither does.
   */
  private refreshQuestMarkers() {
    const { fairyAskedForOffering, fairyQuestCompleted } = getProgress();
    const carrying = hasGoldenCat();
    const offered = hasOfferedGoldenCat();
    this.fairyMarker.setVisible(
      (carrying && !fairyAskedForOffering) || (offered && !fairyQuestCompleted),
    );
    // `!offered` is belt and braces rather than a fix: the statue is one enum
    // field, so CARRIED and OFFERED cannot both hold and `carrying` already
    // goes false the instant it is set down. It is stated anyway because this
    // line is where "the altar still wants something" is decided, and that is
    // the one place the altar's own condition should be readable without
    // having to go and check what `hasGoldenCat` excludes.
    this.altarMarker.setVisible(carrying && !offered && fairyAskedForOffering);
  }

  private fairyDialogue(): DialogueId {
    if (hasOfferedGoldenCat()) return 'pondFairyOffered';
    return hasGoldenCat() ? 'pondFairyFound' : 'pondFairyWaiting';
  }
  /** The marker only wins an E when it beats the fairy and the altar. */
  private nearestSign() {
    const p = this.player.body;
    const sign = this.exitSigns.nearest(p.x, p.y);
    if (!sign) return undefined;
    const target = this.target();
    if (!target) return sign;
    const point = target === 'fairy' ? GARDEN.fairy : GARDEN.altar;
    const distance = Phaser.Math.Distance.Between(p.x, p.y, point.x, point.y);
    return sign.distance < distance ? sign : undefined;
  }

  private target() {
    const p = this.player.body;
    // Both ranges read the configured points, so the fairy's float never
    // changes how close the player has to stand.
    const toFairy = Phaser.Math.Distance.Between(
        p.x,
        p.y,
        GARDEN.fairy.x,
        GARDEN.fairy.y,
      ),
      toAltar = Phaser.Math.Distance.Between(
        p.x,
        p.y,
        GARDEN.altar.x,
        GARDEN.altar.y,
      );
    if (toFairy < GARDEN.interactionRange && toFairy <= toAltar) return 'fairy';
    if (toAltar < GARDEN.interactionRange) return 'altar';
    return null;
  }
  update(_time: number, delta: number) {
    if (!this.controls) return;
    if (!this.controls.active) {
      this.player.stop();
      this.controls.reset();
      this.prompt.setVisible(false);
      this.exitSigns.hide();
      return;
    }
    this.player.update(this.controls.movement(), delta);
    this.refreshQuestMarkers();
    const body = this.player.body;
    const sign = this.nearestSign();
    this.exitSigns.refresh(body.x, body.y, sign?.sign);
    const target = sign ? undefined : this.target();
    this.prompt.setVisible(Boolean(target));
    if (target === 'fairy')
      this.prompt.setPosition(
        this.fairy.sprite.x,
        this.fairy.sprite.y - FAIRY_PROMPT_RISE,
      );
    // The altar prompt clears the statue that stands on it once offered.
    else if (target)
      this.prompt.setPosition(
        this.altar.x,
        this.altar.y - (this.offering.visible ? 116 : 84),
      );
    this.travel.tryExit(body.x, body.y, () => {
      this.miss.hide();
      this.prompt.setVisible(false);
      this.exitSigns.hide();
    });
  }
}
