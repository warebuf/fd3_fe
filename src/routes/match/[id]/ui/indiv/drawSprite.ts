
import type { Atlas, SpriteDesc } from "$lib/sprites/sprite2"

// x, y is the center of the sprite
export function drawSprite(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number,
    atlas: Atlas,
    action: number,
    sprite: SpriteDesc,
    facingForward: boolean,
) {

    const imgIdx = atlas.actionToImageIdx[action];

    const frameHeight = atlas.instructions[imgIdx].FrameHeight;
    const frameWidth = atlas.instructions[imgIdx].FrameWidth;

    const centerX = -(frameWidth/2);
    const centerY = -(frameHeight/2);

    const spriteSheetX = sprite.durationIdx * frameWidth;
    const spriteSheetY = (facingForward ? 4 : 0)  * frameHeight;

    ctx.drawImage(
        atlas.images[imgIdx], 
        spriteSheetX, spriteSheetY, // top left corner of frame
        frameWidth, frameHeight, // frame dimensions
        x+centerX, y+centerY, // destination coordinates
        frameWidth, frameHeight, // destination dimensions
    );

}