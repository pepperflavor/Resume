import * as Phaser from 'phaser';
import {
  GUILD_DOOR,
  GUILD_NOTICE_BOARD,
  GUILD_ROAD,
  GUILD_WORLD,
  GUILD_YARD,
} from '@/game/config/guild';
import {
  GUILD_EXTERIOR_TEXTURES,
  GUILD_GROUND,
  GUILD_SHARED_TEXTURES,
} from '@/game/config/guildAssets';
import { SCENE_KEYS, spawnPoint, type SceneEntry } from '@/game/config/scenes';
import { loadPlayerAssets } from '@/game/loaders/characters';
import { createGuildMap } from '@/game/objects/GuildMap';
import type { ExitSign } from '@/game/config/exitSigns';
import { ExitSigns } from '@/game/objects/ExitSigns';
import { HintBubble } from '@/game/objects/HintBubble';
import { InteractionMissBubble } from '@/game/objects/InteractionMissBubble';
import { Player } from '@/game/objects/Player';
import { InputManager } from '@/game/input/InputManager';
import { configureSceneCamera } from '@/game/systems/SceneCamera';
import { SceneTransition } from '@/game/systems/SceneTransition';
import { insideZone } from '@/game/systems/collision';
import type { GameCallbacks } from '@/game/types';
import { setSceneBgm } from '@/game/state/audio';

const PRESS_HINT = 'Press E';
/** Where the door's idle label shows: the forecourt and the road below it. */
const DOOR_ZONE = {
  x: GUILD_YARD.west,
  y: GUILD_YARD.north,
  width: GUILD_YARD.east - GUILD_YARD.west,
  height: GUILD_ROAD.foot.south - GUILD_YARD.north,
};

export class AdventurerGuildScene extends Phaser.Scene {
  private player!: Player;
  private miss!: InteractionMissBubble;
  private controls!: InputManager;
  private travel!: SceneTransition;
  private doorHint!: HintBubble;
  private boardHint!: HintBubble;
  private exitSigns!: ExitSigns;
  private entry: SceneEntry = {};

  constructor(private readonly callbacks: GameCallbacks) {
    super(SCENE_KEYS.guild);
  }

  init(entry: SceneEntry = {}) {
    this.entry = entry;
  }

  preload() {
    loadPlayerAssets(this);
    for (const asset of [
      ...GUILD_EXTERIOR_TEXTURES,
      ...GUILD_SHARED_TEXTURES,
      GUILD_GROUND,
    ])
      if (!this.textures.exists(asset.key))
        this.load.image(asset.key, asset.url);
  }

  create() {
    setSceneBgm('guild');
    const obstacles = createGuildMap(this);
    // Both way-marks stand in the tree line, which already blocks that ground,
    // so they add no collision of their own.
    this.exitSigns = new ExitSigns(this, 'guild');
    obstacles.push(...this.exitSigns.collision());
    this.player = new Player(this, obstacles, spawnPoint('guild', this.entry));
    // The forecourt is exactly the desktop viewport; on a device viewport the
    // same call zooms in and trails the player instead.
    configureSceneCamera(this, this.player, GUILD_WORLD);
    if (this.entry.from === 'guildInterior') this.player.face('down');
    this.miss = new InteractionMissBubble(this, this.player.body);
    this.doorHint = new HintBubble(this, GUILD_DOOR.x, GUILD_DOOR.y - 84);
    this.doorHint.setText(GUILD_DOOR.hint);
    this.doorHint.setVisible(false);
    // The board carries no standing label: it only speaks up within reach.
    this.boardHint = new HintBubble(
      this,
      GUILD_NOTICE_BOARD.x,
      GUILD_NOTICE_BOARD.y - 46,
    );
    this.boardHint.setText(PRESS_HINT);
    this.boardHint.setVisible(false);
    this.travel = new SceneTransition(this, this.player, 'guild');
    this.controls = new InputManager(
      this,
      () => {
        if (this.travel.locked || this.callbacks.isOverlayOpen()) return;
        const picked = this.pick();
        if (picked.kind === 'none') {
          this.miss.show();
          return;
        }
        this.miss.hide();
        this.doorHint.setVisible(false);
        this.boardHint.setVisible(false);
        this.player.stop();
        this.controls.reset();
        if (picked.kind === 'sign') {
          this.callbacks.onInteract(picked.sign.dialogue);
          return;
        }
        if (picked.kind === 'board') {
          this.callbacks.onInteract('guildNoticeBoard');
          return;
        }
        // The bureau door is not an edge zone: it needs an explicit E, then the
        // ordinary fade carries the player inside.
        this.travel.start(SCENE_KEYS.guildInterior, { from: 'guild' });
      },
      {
        isOverlayOpen: () => this.callbacks.isOverlayOpen(),
        isTravelLocked: () => this.travel.locked,
      },
    );
    this.travel.enter(Boolean(this.entry.from));
    this.callbacks.onReady();
  }

  private atDoor() {
    const body = this.player.body;
    return (
      Phaser.Math.Distance.Between(body.x, body.y, GUILD_DOOR.x, GUILD_DOOR.y) <
      GUILD_DOOR.range
    );
  }

  private toBoard() {
    const body = this.player.body;
    return Phaser.Math.Distance.Between(
      body.x,
      body.y,
      GUILD_NOTICE_BOARD.anchor.x,
      GUILD_NOTICE_BOARD.anchor.y,
    );
  }

  /**
   * One winner for one E. The door, the notice board and the two way-marks all
   * compete on distance, so no two can ever fire from a single press.
   */
  private pick():
    | { kind: 'door' }
    | { kind: 'board' }
    | { kind: 'sign'; sign: ExitSign }
    | { kind: 'none' } {
    const body = this.player.body;
    const door = Phaser.Math.Distance.Between(
      body.x,
      body.y,
      GUILD_DOOR.x,
      GUILD_DOOR.y,
    );
    const board = this.toBoard();
    const sign = this.exitSigns.nearest(body.x, body.y);
    const candidates: { kind: 'door' | 'board'; distance: number }[] = [];
    if (door < GUILD_DOOR.range)
      candidates.push({ kind: 'door', distance: door });
    if (board < GUILD_NOTICE_BOARD.range)
      candidates.push({ kind: 'board', distance: board });
    const best = candidates.sort((a, b) => a.distance - b.distance)[0];
    if (best && (!sign || best.distance <= sign.distance))
      return { kind: best.kind };
    if (sign) return { kind: 'sign', sign: sign.sign };
    return { kind: 'none' };
  }

  update(_time: number, delta: number) {
    if (!this.controls) return;
    if (!this.controls.active) {
      this.controls.reset();
      this.player.stop();
      this.doorHint.setVisible(false);
      this.boardHint.setVisible(false);
      this.exitSigns.hide();
      return;
    }
    this.player.update(this.controls.movement(), delta);
    const body = this.player.body;
    const picked = this.pick();
    this.boardHint.setVisible(picked.kind === 'board');
    this.exitSigns.refresh(
      body.x,
      body.y,
      picked.kind === 'sign' ? picked.sign : undefined,
    );
    // Press E beats the idle label, and outside the forecourt there is nothing.
    if (this.atDoor()) {
      this.doorHint.setText(PRESS_HINT);
      this.doorHint.setVisible(true);
    } else if (insideZone(body.x, body.y, DOOR_ZONE)) {
      this.doorHint.setText(GUILD_DOOR.hint);
      this.doorHint.setVisible(true);
    } else {
      this.doorHint.setVisible(false);
    }
    this.travel.tryExit(body.x, body.y, () => {
      this.miss.hide();
      this.doorHint.setVisible(false);
      this.boardHint.setVisible(false);
      this.exitSigns.hide();
    });
  }
}
