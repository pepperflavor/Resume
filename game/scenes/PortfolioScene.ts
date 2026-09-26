import * as Phaser from 'phaser';
import { loadAuditedAtlas } from '@/game/objects/AuditedProps';
import {
  HOME_NPCS,
  HOME_NPC_RANGE,
  HOME_SIGN,
  HOME_STATIC_INTERACTABLES,
} from '@/game/config/home';
import {
  HOME_GROUND,
  HOME_HOUSE_TEXTURE,
  HOME_TEXTURES,
} from '@/game/config/homeAssets';
import { SCENE_KEYS, spawnPoint, type SceneEntry } from '@/game/config/scenes';
import { loadPlayerAssets, loadNpcAssets } from '@/game/loaders/characters';
import { createHomeMap } from '@/game/objects/HomeMap';
import { ExitSigns } from '@/game/objects/ExitSigns';
import { SIGN_HINT_OFFSET } from '@/game/objects/homeScenery';
import { AmbientNpc } from '@/game/objects/AmbientNpc';
import { HintBubble } from '@/game/objects/HintBubble';
import { InteractionMissBubble } from '@/game/objects/InteractionMissBubble';
import { Npc } from '@/game/objects/Npc';
import { Player } from '@/game/objects/Player';
import { getKkokkoQuest, setKkokkoQuest } from '@/game/state/gameState';
import { SceneControls } from '@/game/systems/SceneControls';
import { SceneTransition } from '@/game/systems/SceneTransition';
import type { GameCallbacks, PortfolioEntry } from '@/game/types';
import { setSceneBgm } from '@/game/state/audio';

const HOME_NPC_KINDS = [...new Set(HOME_NPCS.map((npc) => npc.kind))];

// Kkokko is Home's chicken. She is only in the yard until the player picks her
// up; afterwards she belongs to the Market.
const KKOKKO_AT_HOME = ['NOT_STARTED', 'ACCEPTED'];

// The cottage, the notice board and both animals share one list, so a single
// nearest-pick decides what E talks to and two targets can never fire at once.
interface HomeTarget {
  id: string;
  entry: PortfolioEntry;
  range: number;
  x: number;
  y: number;
  npc?: Npc;
  ambient?: AmbientNpc;
}

export class PortfolioScene extends Phaser.Scene {
  private player!: Player;
  private miss!: InteractionMissBubble;
  private controls!: SceneControls;
  private travel!: SceneTransition;
  private prompt!: Phaser.GameObjects.Text;
  private signHint!: HintBubble;
  private exitSigns!: ExitSigns;
  private ambient: AmbientNpc[] = [];
  private targets: HomeTarget[] = [];
  private entry: SceneEntry = {};

  constructor(private readonly callbacks: GameCallbacks) {
    super(SCENE_KEYS.home);
  }

  init(entry: SceneEntry = {}) {
    this.entry = entry;
    // Phaser reuses the Scene instance on return; never keep old sprite references.
    this.ambient = [];
    this.targets = [];
  }

  preload() {
    loadPlayerAssets(this);
    loadNpcAssets(this, HOME_NPC_KINDS);
    loadAuditedAtlas(this, 'overworld_tileset');
    if (!this.textures.exists(HOME_GROUND.key))
      this.load.image(HOME_GROUND.key, HOME_GROUND.url);
    if (!this.textures.exists(HOME_HOUSE_TEXTURE.key))
      this.load.image(HOME_HOUSE_TEXTURE.key, HOME_HOUSE_TEXTURE.url);
    for (const { key, url } of HOME_TEXTURES)
      if (!this.textures.exists(key)) this.load.image(key, url);
  }

  create() {
    setSceneBgm('home');
    const obstacles = createHomeMap(this);
    // Way-marks are built before the player so their posts can join the
    // obstacle list the player is constructed with.
    this.exitSigns = new ExitSigns(this, 'home');
    obstacles.push(...this.exitSigns.collision());

    const roster = HOME_NPCS.filter(
      (npc) =>
        npc.kind !== 'chicken' || KKOKKO_AT_HOME.includes(getKkokkoQuest()),
    );
    for (const config of roster) {
      const npc = new Npc(this, config.kind, config.x, config.y, {
        scale: config.scale,
        mode: 'animated',
      });
      npc.sprite.setName(`home-npc-${config.kind}`);
      const ambient = new AmbientNpc(npc, config.wanderArea, obstacles);
      this.ambient.push(ambient);
      this.targets.push({
        id: config.kind,
        entry: config.dialogue,
        range: HOME_NPC_RANGE,
        x: config.x,
        y: config.y,
        npc,
        ambient,
      });
    }
    for (const target of HOME_STATIC_INTERACTABLES)
      this.targets.push({ ...target });

    this.player = new Player(this, obstacles, spawnPoint('home', this.entry));
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
    this.signHint = new HintBubble(
      this,
      HOME_SIGN.x,
      HOME_SIGN.y + SIGN_HINT_OFFSET,
    );
    this.signHint.setText(HOME_SIGN.idleHint);
    this.miss = new InteractionMissBubble(this, this.player.body);
    this.travel = new SceneTransition(this, this.player, 'home');
    this.controls = new SceneControls(this, () => {
      if (this.travel.locked || this.callbacks.isOverlayOpen()) return;
      const picked = this.pick();
      if (picked.sign) {
        this.miss.hide();
        this.player.stop();
        this.controls.reset();
        this.prompt.setVisible(false);
        this.callbacks.onInteract(picked.sign.sign.dialogue);
        return;
      }
      const target = picked.target;
      if (!target) {
        this.miss.show();
        return;
      }
      // Hold the animal still so it cannot wander off mid-conversation.
      target.ambient?.beginInteraction();
      this.miss.hide();
      this.player.stop();
      this.controls.reset();
      this.prompt.setVisible(false);
      // With the quest accepted the chicken offers to be carried back instead
      // of just clucking. Picking that choice fires this confirm callback.
      if (target.id === 'chicken' && getKkokkoQuest() === 'ACCEPTED') {
        this.callbacks.onInteract('kkokkoTake', () => {
          setKkokkoQuest('CHICKEN_FOUND');
          this.removeTarget('chicken');
        });
        return;
      }
      this.callbacks.onInteract(target.entry);
    });
    this.travel.enter(Boolean(this.entry.from));
    this.callbacks.onReady();
  }

  /** Takes a follower out of the yard for good once she has been picked up. */
  private removeTarget(id: string) {
    const target = this.targets.find((candidate) => candidate.id === id);
    if (!target) return;
    target.npc?.destroy();
    if (target.ambient)
      this.ambient = this.ambient.filter((npc) => npc !== target.ambient);
    this.targets = this.targets.filter((candidate) => candidate !== target);
  }

  /**
   * One winner for one E: the nearest interactable, way-marks included, so a
   * sign standing near an animal can never fire alongside it.
   */
  private pick() {
    const body = this.player.body;
    const target = this.nearestTarget();
    const sign = this.exitSigns.nearest(body.x, body.y);
    if (sign && (!target || sign.distance < target.distance))
      return { sign, target: undefined };
    return { sign: undefined, target };
  }

  private nearestTarget() {
    const player = this.player.body;
    return this.targets
      .map((target) => {
        const x = target.npc ? target.npc.sprite.x : target.x;
        const y = target.npc ? target.npc.sprite.y : target.y;
        return {
          ...target,
          x,
          y,
          distance: Phaser.Math.Distance.Between(player.x, player.y, x, y),
        };
      })
      .filter((target) => target.distance < target.range)
      .sort((a, b) => a.distance - b.distance)[0];
  }

  update(_time: number, delta: number) {
    if (!this.controls) return;
    const locked =
      this.travel.locked ||
      this.callbacks.isOverlayOpen() ||
      !this.controls.focused;
    for (const npc of this.ambient) npc.update(delta, locked);
    if (locked) {
      this.controls.reset();
      this.player.stop();
      this.prompt.setVisible(false);
      this.exitSigns.hide();
      return;
    }
    this.player.update(this.controls.movement(), delta);
    const picked = this.pick();
    const body = this.player.body;
    this.exitSigns.refresh(body.x, body.y, picked.sign?.sign);
    const target = picked.target;
    // The board carries its own bubble, so the shared prompt stays out of its way.
    const signActive = target?.id === 'sign';
    this.signHint.setText(
      signActive ? HOME_SIGN.activeHint : HOME_SIGN.idleHint,
    );
    this.prompt.setVisible(Boolean(target) && !signActive);
    if (target && !signActive) this.prompt.setPosition(target.x, target.y - 56);
    this.travel.tryExit(body.x, body.y, () => {
      this.prompt.setVisible(false);
      this.miss.hide();
      this.exitSigns.hide();
    });
  }
}
