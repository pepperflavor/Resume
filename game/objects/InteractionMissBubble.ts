import * as Phaser from 'phaser';

export class InteractionMissBubble {
  private readonly bubble: Phaser.GameObjects.Container;
  private timer?: Phaser.Time.TimerEvent;
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.GameObjects.Sprite,
  ) {
    const shape = scene.add.graphics();
    shape.fillStyle(0x17212e).fillRect(-18, -24, 36, 22);
    shape.fillTriangle(-5, -3, 5, -3, 0, 3);
    shape.lineStyle(2, 0xa5e3bc).strokeRect(-18, -24, 36, 22);
    const text = scene.add
      .text(0, -15, '...', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.bubble = scene.add
      .container(0, 0, [shape, text])
      .setName('interaction-miss-bubble')
      .setDepth(1100)
      .setVisible(false);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.follow, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.hide();
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.follow, this);
      this.bubble.destroy();
    });
  }
  show() {
    this.timer?.remove(false);
    this.follow();
    this.bubble.setVisible(true);
    this.timer = this.scene.time.delayedCall(850, () => this.hide());
  }
  hide() {
    this.timer?.remove(false);
    this.timer = undefined;
    this.bubble.setVisible(false);
  }
  private follow() {
    this.bubble.setPosition(
      Math.round(this.player.x),
      Math.round(this.player.y - 45),
    );
  }
}
