
import type { Atlas } from "$lib/sprites/sprite2"

// x, y is the center of the sprite
export function drawSprite(
    atlas: Atlas,
    animation: string,
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number,
    direction: number // 0 is up, 4 is down
) {

    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();

}