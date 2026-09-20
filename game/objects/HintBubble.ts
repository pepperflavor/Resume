import * as Phaser from 'phaser';

/**
 * A label that stays above a fixed world spot and swaps its text, unlike
 * SpeechBubble which fades itself after a delay. The notice board uses it to
 * read "Read Me!" until the player is close enough to press E.
 */
export class HintBubble {
  private readonly container: Phaser.GameObjects.Container;
  private readonly label: Phaser.GameObjects.Text;
  private readonly frame: Phaser.GameObjects.Graphics;
  private text = '';
  constructor(scene: Phaser.Scene, x: number, y: number) {
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
      .container(Math.round(x), Math.round(y), [this.frame, this.label])
      .setName('hint-bubble')
      .setDepth(1100);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.container.destroy(),
    );
  }

  setText(text: string) {
    if (text === this.text) return;
    this.text = text;
    this.label.setText(text);
    const width = Math.ceil(this.label.width) + 16;
    const height = Math.ceil(this.label.height) + 12;
    this.frame
      .clear()
      .fillStyle(0x1b2331)
      .fillRect(-width / 2, -height, width, height)
      .fillTriangle(-5, 0, 5, 0, 0, 6)
      .lineStyle(2, 0xc8a86b)
      .strokeRect(-width / 2, -height, width, height);
    this.label.setPosition(0, -height / 2);
  }

  /** Market's shopkeepers and animals move, so their bubble is repositioned. */
  moveTo(x: number, y: number) {
    this.container.setPosition(Math.round(x), Math.round(y));
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }
}
