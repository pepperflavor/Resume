import * as Phaser from 'phaser';
import { GARDEN } from '@/game/config/garden';
import { GOLDEN_CAT_TEXTURES } from '@/game/config/assets';
import { SCENE_KEYS, spawnPoint, type SceneEntry } from '@/game/config/scenes';
import { WORLD } from '@/game/config/world';
import type { DialogueId } from '@/game/config/dialogues';
import {
  loadGoldenCatAssets,
  loadNpcAssets,
  loadPlayerAssets,
} from '@/game/loaders/characters';
import { createCaveGardenMap } from '@/game/objects/CaveGardenMap';
import { ExitSigns } from '@/game/objects/ExitSigns';
import {
  loadRuntimeAtlas,
  loadRuntimeGround,
} from '@/game/objects/RuntimeProps';
import { InteractionMissBubble } from '@/game/objects/InteractionMissBubble';
import { Npc } from '@/game/objects/Npc';
import { Player } from '@/game/objects/Player';
import { SceneControls } from '@/game/systems/SceneControls';
import { SceneTransition } from '@/game/systems/SceneTransition';
import type { GameCallbacks } from '@/game/types';

export class CaveGardenScene extends Phaser.Scene {
  private player!: Player;
  private fairy!: Npc;
  private altar!: Phaser.GameObjects.Image;
  private offering!: Phaser.GameObjects.Image;
  private controls!: SceneControls;
  private travel!: SceneTransition;
  private miss!: InteractionMissBubble;
  private prompt!: Phaser.GameObjects.Text;
  private exitSigns!: ExitSigns;
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
    loadRuntimeAtlas(this, 'gardenOffering');
    loadRuntimeAtlas(this, 'gardenWater');
    loadRuntimeAtlas(this, 'gardenPondEdge');
    loadRuntimeAtlas(this, 'gardenEnvironment');
    loadRuntimeAtlas(this, 'gardenLight');
    loadRuntimeAtlas(this, 'gardenLightShaft');
    loadRuntimeGround(this, 'caveGarden');
  }
  create() {
    // The grotto is exactly the viewport, and the perimeter planting is drawn
    // past its edges on purpose: bounds keep anything outside off the screen.
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
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
      .setVisible(this.callbacks.hasOfferedGoldenCat());
    this.player = new Player(
      this,
      obstacles,
      spawnPoint('caveGarden', this.entry),
    );
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
    this.controls = new SceneControls(this, () => {
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
        this.callbacks.onInteract(this.fairyDialogue());
        return;
      }
      if (this.callbacks.hasGoldenCat())
        this.callbacks.onInteract('offeringAltarWithCat', () => {
          if (!this.scene.isActive()) return;
          this.callbacks.offerGoldenCat();
          this.offering.setVisible(true);
        });
      else
        this.callbacks.onInteract(
          this.callbacks.hasOfferedGoldenCat()
            ? 'offeringAltarDone'
            : 'offeringAltar',
        );
    });
    this.travel.enter(true);
    this.callbacks.onReady();
  }
  private fairyDialogue(): DialogueId {
    if (this.callbacks.hasOfferedGoldenCat()) return 'pondFairyOffered';
    return this.callbacks.hasGoldenCat()
      ? 'pondFairyFound'
      : 'pondFairyWaiting';
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
    if (
      this.travel.locked ||
      this.callbacks.isOverlayOpen() ||
      !this.controls.focused
    ) {
      this.player.stop();
      this.controls.reset();
      this.prompt.setVisible(false);
      this.exitSigns.hide();
      return;
    }
    this.player.update(this.controls.movement(), delta);
    const body = this.player.body;
    const sign = this.nearestSign();
    this.exitSigns.refresh(body.x, body.y, sign?.sign);
    const target = sign ? undefined : this.target();
    this.prompt.setVisible(Boolean(target));
    if (target === 'fairy')
      this.prompt.setPosition(this.fairy.sprite.x, this.fairy.sprite.y - 56);
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
