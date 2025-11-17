
import type { Atlas } from "$lib/sprites/sprite2"

// x, y is the center of the sprite
export function drawSprite(
    atlas: Atlas,
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number,
    facingForward: boolean,
) {

    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();

}