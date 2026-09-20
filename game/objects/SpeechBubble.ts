import * as Phaser from 'phaser';

// Ambient speech above a world object. It never blocks movement and never
// stacks: showing a new line replaces the current one.
export class SpeechBubble {
  private readonly container: Phaser.GameObjects.Container;
  private readonly label: Phaser.GameObjects.Text;
  private readonly frame: Phaser.GameObjects.Graphics;
  private timer?: Phaser.Time.TimerEvent;
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly target: Phaser.GameObjects.Components.Transform,
    private readonly offsetY: number,
  ) {
    this.frame = scene.add.graphics();
    this.label = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#fff4cf',
        align: 'center',
      })
      .setOrigin(0.5);
    this.container = scene.add
      .container(0, 0, [this.frame, this.label])
      .setName('speech-bubble')
      .setDepth(1100)
      .setVisible(false);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.follow, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.hide();
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.follow, this);
      this.container.destroy();
    });
  }
  get visible() {
    return this.container.visible;
  }
  show(text: string, duration: number) {
    this.timer?.remove(false);
    this.label.setText(text);
    const width = Math.ceil(this.label.width) + 16,
      height = Math.ceil(this.label.height) + 12;
    this.frame
      .clear()
      .fillStyle(0x1b2331)
      .fillRect(-width / 2, -height, width, height)
      .fillTriangle(-5, 0, 5, 0, 0, 6)
      .lineStyle(2, 0xc8a86b)
      .strokeRect(-width / 2, -height, width, height);
    this.label.setPosition(0, -height / 2);
    this.follow();
    this.container.setVisible(true);
    this.timer = this.scene.time.delayedCall(duration, () => this.hide());
  }
  hide() {
    this.timer?.remove(false);
    this.timer = undefined;
    this.container.setVisible(false);
  }
  private follow() {
    this.container.setPosition(
      Math.round(this.target.x),
      Math.round(this.target.y + this.offsetY),
    );
  }
}
