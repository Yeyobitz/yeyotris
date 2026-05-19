---
name: phaser
version: "3.80.1"
description: Phaser 3.80.1 game framework best practices for TypeScript + Vite projects. Use when working with Phaser scenes, game objects, input, physics, tweens, asset loading, rendering, or game loop logic.
metadata:
  author: Project Local
  source: https://github.com/phaserjs/phaser/tree/v3.80.1
---

# Phaser 3.80.1

> Phaser is an HTML5 game framework for building 2D games. This project uses Phaser 3.80.1 with TypeScript and Vite.

## Project Setup

- Renderer: `Phaser.AUTO` (WebGL preferred, Canvas fallback)
- Build tool: Vite 5.x with TypeScript
- Physics: Arcade Physics (if configured)
- Scale mode: Typically `FIT` or `EXPAND` for responsive games
- Scene architecture: class-based scenes extending `Phaser.Scene`

## Game Configuration

```typescript
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#000000',
  pixelArt: true,         // disables antialias + enables roundPixels
  antialias: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // snap: { width: 16, height: 16 } // 3.80+ feature for pixel-perfect scaling
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene],
  audio: {
    disableWebAudio: false
  }
};

const game = new Phaser.Game(config);
```

## Scenes

Scenes are the primary organizational unit in Phaser 3. Each scene has its own lifecycle, display list, input manager, and camera.

### Scene Lifecycle

```typescript
export class MyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MyScene' });
  }

  // Called once when the scene starts. Use for asset loading.
  preload(): void {
    this.load.image('player', 'assets/player.png');
    this.load.spritesheet('enemy', 'assets/enemy.png', { frameWidth: 32, frameHeight: 32 });
  }

  // Called once after preload completes. Use to initialize game objects.
  create(): void {
    this.add.image(400, 300, 'player');
    
    // Listen to scene events
    this.events.on('shutdown', this.shutdown, this);
    this.events.on('destroy', this.destroy, this);
  }

  // Called every frame while the scene is running.
  update(time: number, delta: number): void {
    // delta = ms since last frame, already smoothed/capped by FPS config
  }

  // Custom cleanup
  shutdown(): void {
    this.events.off('shutdown', this.shutdown, this);
  }

  destroy(): void {
    // Final cleanup
  }
}
```

### Scene Management

```typescript
// Start a scene
this.scene.start('GameScene', { level: 1 }); // passes data to create()

// Pause / Resume
this.scene.pause('GameScene');
this.scene.resume('GameScene');

// Stop and restart
this.scene.stop('GameScene');
this.scene.restart('GameScene');

// Launch multiple scenes (overlay UIs)
this.scene.launch('HUDScene');

// Check if scene is active
if (this.scene.isActive('GameScene')) { ... }

// Sleep / Wake (keeps display list but stops update)
this.scene.sleep('BackgroundScene');
this.scene.wake('BackgroundScene');

// Pass data between scenes via registry (global) or scene transition data
this.registry.set('score', 1000);
const score = this.registry.get('score');

// Scene transition with effects
this.scene.transition({
  target: 'NextScene',
  duration: 1000,
  moveBelow: true,
  onUpdate: (progress: number) => { /* animate */ }
});
```

## Game Objects

### Common Game Objects

```typescript
// Image
const img = this.add.image(x, y, 'key');
img.setOrigin(0.5);       // default center; 0,0 = top-left
img.setDepth(10);
img.setAlpha(0.8);
img.setScale(2);
img.setVisible(false);

// Sprite (animated)
const sprite = this.add.sprite(x, y, 'key');
sprite.play('animKey');

// Text
const text = this.add.text(x, y, 'Hello', {
  fontFamily: 'Arial',
  fontSize: '24px',
  color: '#ffffff'
});
text.setOrigin(0.5);

// Container (groups game objects)
const container = this.add.container(x, y, [img, text]);
container.setDepth(100);

// Rectangle / Graphics
const rect = this.add.rectangle(x, y, width, height, 0xff0000);
const graphics = this.add.graphics();
graphics.fillStyle(0xff0000, 1);
graphics.fillRect(0, 0, 100, 100);

// TileSprite
const tile = this.add.tileSprite(x, y, width, height, 'key');

// RenderTexture (dynamic texture)
const rt = this.add.renderTexture(x, y, width, height);
rt.draw(img, 0, 0);
```

### Position & Origin

- Default origin for most objects is `(0.5, 0.5)` (center), except Graphics and Tilemaps.
- Use `setPosition(x, y)` or direct `x`, `y` properties.
- Use `setDisplaySize(w, h)` to resize while maintaining aspect ratio, or `setScale()`.

## Asset Loading

### Loading Methods

```typescript
preload(): void {
  // Images
  this.load.image('player', 'assets/player.png');
  
  // Spritesheets
  this.load.spritesheet('enemy', 'assets/enemy.png', {
    frameWidth: 32,
    frameHeight: 32,
    startFrame: 0,
    endFrame: 5
  });
  
  // Atlas
  this.load.atlas('ui', 'assets/ui.png', 'assets/ui.json');
  
  // Audio
  this.load.audio('music', 'assets/music.mp3');
  
  // JSON
  this.load.json('levelData', 'assets/level1.json');
  
  // Base64 (Phaser 3.80+ native support)
  this.load.image('embedded', 'data:image/png;base64,iVBORw0KGgo...');
  
  // Progress events
  this.load.on('progress', (value: number) => {
    console.log(`Loading: ${Math.round(value * 100)}%`);
  });
  
  this.load.on('complete', () => {
    console.log('All assets loaded');
  });
}
```

### Loading Best Practices

- Load assets in `BootScene` or a dedicated `PreloadScene`.
- Use `texture atlases` for many small images to reduce draw calls.
- For pixel-art games, disable `antialias` and enable `pixelArt: true` in config.
- Phaser 3.80+ supports base64/Data URI loading natively via the Loader — useful for playable ads or single-file builds.

## Input

### Keyboard

```typescript
create(): void {
  const cursors = this.input.keyboard.createCursorKeys();
  const wasd = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    space: Phaser.Input.Keyboard.KeyCodes.SPACE
  });

  this.input.keyboard.on('keydown-SPACE', (event: KeyboardEvent) => {
    // handle space
  });
}

update(): void {
  if (cursors.left.isDown) {
    player.x -= speed * (delta / 1000);
  }
  
  // JustPressed for single-shot
  if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
    this.jump();
  }
}
```

### Pointer / Mouse

```typescript
const sprite = this.add.sprite(400, 300, 'button');

sprite.setInteractive();

sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
  console.log('Clicked!', pointer.x, pointer.y);
});

sprite.on('pointerover', () => {
  sprite.setTint(0xaaaaaa);
});

sprite.on('pointerout', () => {
  sprite.clearTint();
});

// Dragging
this.input.setDraggable(sprite);
sprite.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
  sprite.x = dragX;
  sprite.y = dragY;
});
```

### Gamepad

```typescript
this.input.gamepad.once('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
  console.log('Gamepad connected', pad.id);
});

// In update():
const pad = this.input.gamepad.getPad(0);
if (pad && pad.A) { /* A button pressed */ }
```

## Physics (Arcade)

```typescript
// Create physics-enabled sprite
const player = this.physics.add.sprite(100, 100, 'player');
player.setCollideWorldBounds(true);
player.setBounce(0.2);
player.setGravityY(300);
player.setVelocityX(200);
player.setDrag(500);
player.setMaxVelocity(300, 500);

// Static bodies (walls, platforms)
const platform = this.physics.add.staticSprite(400, 580, 'ground');

// Colliders
this.physics.add.collider(player, platform);

// Overlap (no bounce)
this.physics.add.overlap(player, stars, (player, star) => {
  star.destroy();
  score += 10;
}, undefined, this);

// Group physics
const bombs = this.physics.add.group({
  key: 'bomb',
  repeat: 5,
  setXY: { x: 12, y: 0, stepX: 70 }
});

// World bounds
this.physics.world.setBounds(0, 0, 800, 600);

// Arcade Body methods
player.body.setSize(20, 30);       // custom hitbox
player.body.setOffset(6, 10);      // hitbox offset
player.body.allowGravity = false;  // disable gravity
player.body.immovable = true;      // won't move on collision

// Velocity with delta time
update(time: number, delta: number): void {
  const speed = 200; // pixels per second
  if (cursors.left.isDown) {
    player.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    player.setVelocityX(speed);
  } else {
    player.setVelocityX(0);
  }
}
```

## Tweens

```typescript
// Basic tween
this.tweens.add({
  targets: sprite,
  x: 600,
  duration: 1000,
  ease: 'Power2',
  yoyo: true,
  repeat: -1,
  delay: 500,
  onComplete: () => { console.log('done'); }
});

// Chain
this.tweens.chain({
  targets: sprite,
  tweens: [
    { x: 600, duration: 500 },
    { y: 400, duration: 500 },
    { alpha: 0, duration: 300 }
  ]
});

// Timeline
const timeline = this.tweens.createTimeline();
timeline.add({ targets: sprite, x: 600, duration: 500 });
timeline.add({ targets: sprite, y: 400, duration: 500 });
timeline.play();

// TweenChainBuilder persist fix (3.80): default persist is now false.
// Set persist: true if you need the chain to survive scene transitions.
```

## Audio

```typescript
// Play music
const music = this.sound.add('music', { loop: true, volume: 0.5 });
music.play();

// Play SFX
this.sound.play('jump', { volume: 0.8 });

// WebAudio vs HTML5Audio
// WebAudio is default and recommended. HTML5Audio fallback is used if disableWebAudio: true.

// Pause / Resume all
this.sound.pauseAll();
this.sound.resumeAll();

// Mute
this.sound.mute = true;
```

## Cameras

```typescript
// Main camera
this.cameras.main.setBounds(0, 0, 1600, 1200);
this.cameras.main.startFollow(player);
this.cameras.main.setZoom(2);
this.cameras.main.setLerp(0.1, 0.1); // smooth follow

// Background color
this.cameras.main.setBackgroundColor('#87CEEB');

// Shake / Flash / Fade
this.cameras.main.shake(200, 0.01);
this.cameras.main.flash(300);
this.cameras.main.fadeOut(1000);

// Multiple cameras
const uiCam = this.cameras.add(0, 0, 800, 600);
uiCam.ignore(worldLayer);
this.cameras.main.ignore(uiElements);
```

## Animations

```typescript
// Create animation (typically in BootScene or first scene)
this.anims.create({
  key: 'walk',
  frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
  frameRate: 10,
  repeat: -1
});

// Or from atlas
this.anims.create({
  key: 'run',
  frames: this.anims.generateFrameNames('playerAtlas', { prefix: 'run_', start: 1, end: 8 }),
  frameRate: 12,
  repeat: -1
});

// Play
sprite.play('walk');
sprite.anims.pause();
sprite.anims.resume();
sprite.anims.stop();
sprite.anims.restart();

// Events
sprite.on('animationcomplete', (anim: Phaser.Animations.Animation) => {
  if (anim.key === 'attack') {
    sprite.play('idle');
  }
});
```

## Particle System

```typescript
const particles = this.add.particles(0, 0, 'particleTexture', {
  speed: 100,
  scale: { start: 1, end: 0 },
  blendMode: 'ADD',
  lifespan: 600,
  gravityY: 200,
  quantity: 2,
  frequency: 50
});

particles.startFollow(sprite);
```

## Textures & Graphics

```typescript
// Generate texture from Graphics (useful for dynamic shapes)
const graphics = this.make.graphics({ x: 0, y: 0, add: false });
graphics.fillStyle(0xff0000, 1);
graphics.fillRect(0, 0, 32, 32);
graphics.generateTexture('redBlock', 32, 32);

// Use generated texture
const block = this.add.image(100, 100, 'redBlock');

// Dynamic texture (3.80+)
const dt = this.add.dynamicTexture(200, 200);
dt.draw(frame, x, y);
dt.setPixel(x, y, r, g, b, a);

// RenderTexture
const rt = this.add.renderTexture(x, y, width, height);
rt.draw(sprite, 0, 0);
// 3.80+: DynamicTexture auto-calls setSize() for Canvas mode too.
```

## Scale Manager

### Scale Modes

- `NONE` — no scaling
- `WIDTH_CONTROLS_HEIGHT` — width sets height based on aspect ratio
- `HEIGHT_CONTROLS_WIDTH` — height sets width based on aspect ratio
- `FIT` — fits within parent while maintaining aspect ratio (letterboxing)
- `RESIZE` — resizes canvas to fill parent (may distort aspect ratio)
- `EXPAND` — **(3.80+)** keeps aspect ratio, expands in the direction that has more space (Godot-style)

```typescript
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  min: { width: 400, height: 300 },
  max: { width: 1600, height: 1200 },
  // snap: { width: 16, height: 16 } // pixel-perfect integer scaling (3.80+)
}
```

### Orientation

```typescript
this.scale.on('orientationchange', (orientation: Phaser.Scale.Orientation) => {
  if (orientation === Phaser.Scale.Orientation.PORTRAIT) {
    // show rotate device message
  }
});
```

## Data & Storage

```typescript
// Scene-local data
this.data.set('lives', 3);
const lives = this.data.get('lives');

// Global registry (shared across all scenes)
this.registry.set('highscore', 5000);
const hs = this.registry.get('highscore');

// Events on registry
this.registry.events.on('changedata-highscore', (parent: any, value: number) => {
  console.log('New high score:', value);
});

// Web Storage (manual implementation or use Phaser.Data.DataManager)
const saved = localStorage.getItem('save');
if (saved) {
  const data = JSON.parse(saved);
  this.registry.set('progress', data.progress);
}
```

## Time & Timers

```typescript
// Delayed call
this.time.delayedCall(1000, () => {
  console.log('1 second passed');
}, [], this);

// Repeat event
this.time.addEvent({
  delay: 500,
  callback: this.spawnEnemy,
  callbackScope: this,
  loop: true
});

// Clock
const clock = this.time.now; // ms since game started

// Timeline looping (3.80+)
const timeline = this.add.timeline([
  { at: 0, run: () => this.doSomething() },
  { at: 1000, run: () => this.doSomethingElse() }
]);
timeline.repeat(3); // loop 3 additional times
timeline.play();
```

## TypeScript Best Practices

### Scene Class Pattern

```typescript
interface GameSceneData {
  level: number;
  score: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    this.score = data.score ?? 0;
  }

  preload(): void {
    // load assets
  }

  create(): void {
    // setup game objects
  }

  update(time: number, delta: number): void {
    // game loop
  }
}
```

### Type-Safe Asset Keys

```typescript
// Use string literals or enums for asset keys to avoid typos
export enum AssetKeys {
  Player = 'player',
  Enemy = 'enemy',
  Background = 'background',
  JumpSfx = 'jump-sfx'
}

// Then use: this.load.image(AssetKeys.Player, 'assets/player.png');
```

### Null Safety

```typescript
// Use definite assignment assertions (!) for objects created in create()
private player!: Phaser.Physics.Arcade.Sprite;

// Or use optional chaining where appropriate
this.player?.setVelocityX(100);

// Check existence before use
if (this.player && this.player.body) {
  // safe to use body
}
```

## Renderer Configuration

### WebGL vs Canvas

```typescript
// Force WebGL
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  // ...
};

// WebGL-specific settings
render: {
  batchSize: 4096,         // default quad batch size
  maxLights: 10,           // max lights per camera
  antialias: true,         // texture smoothing
  pixelArt: false,         // set true to disable smoothing
  mipmapFilter: 'LINEAR',  // LINEAR or NEAREST
  defaultPipeline: 'MultiPipeline'
}
```

### Post FX (WebGL only)

```typescript
// Built-in Pre/Post FX (if not disabled in config)
sprite.preFX.addBloom(0xffffff, 1, 1, 2, 1.2);
sprite.postFX.addBlur(1, 1, 1, 2);
sprite.postFX.addGlow(0xff0000, 4, 0, false, 0.1, 10);

// Disable FX pipelines in config for performance:
// disablePreFX: true,
// disablePostFX: true
```

## Performance Tips

- **Object Pooling**: Reuse sprites instead of creating/destroying frequently.
- **Atlases**: Pack sprites into texture atlases to reduce draw calls.
- **Cull**: Disable `update` logic for off-screen objects.
- **Camera Ignore**: Use multiple cameras to avoid updating UI every frame with world coordinates.
- **Round Pixels**: Enable `roundPixels: true` for pixel-art to avoid sub-pixel rendering.
- **WebGL Batch Size**: Lower `batchSize` if experiencing GPU memory issues.
- **Disable Unused Pipelines**: Set `disablePreFX: true` / `disablePostFX: true` if not using FX.
- **Canvas vs WebGL**: Use `Phaser.CANVAS` for simple 2D games on low-end mobile if WebGL is slow.

## Phaser 3.80 New Features Summary

- **WebGL Context Restore**: Game automatically recovers after losing WebGL context.
- **Base64 Loader**: Native support for loading base64/Data URI assets directly.
- **Scale Manager Snap Mode**: `snap: { width, height }` for integer pixel-perfect scaling.
- **EXPAND Scale Mode**: New mode similar to Godot's expand.
- **Timeline Looping**: `timeline.repeat(count)` for repeating timeline events.
- **Tilemap improvements**: `createFromTiles` now copies rotation, flip, alpha, visible, tint.
- **DynamicTexture improvements**: Auto `setSize()` for Canvas mode, memory leak fix.
- **Input consistency**: Touch events no longer fire through DOM elements.
- **Mouse/Touch**: Uses `sourceCapabilities.firesTouchEvents` to prevent duplicate input.

## Useful Links

- API Docs: https://newdocs.phaser.io
- Examples: https://labs.phaser.io
- GitHub: https://github.com/phaserjs/phaser/tree/v3.80.1
- Forums: https://phaser.discourse.group
