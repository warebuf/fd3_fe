import type { Image } from "lucide-svelte";


export function drawTarget(ctx: CanvasRenderingContext2D, cx: number, cy: number, targetSprite: ImageBitmap){

    const w = 70;
    const h = 70;

    ctx.strokeStyle = "red";
    ctx.strokeRect(cx,cy,1,1);
    ctx.drawImage(
        targetSprite,
        cx - (w/2), cy - (h/2),
        w,h
    )
}

export function drawTargetButton(ctx: CanvasRenderingContext2D, cx: number, cy: number, targetIconSprite : ImageBitmap ) {

    const size = 16;
    const borderRadius = 3;

    const x = cx - (size / 2);
    const y = cy - (size / 2);
 
    ctx.beginPath();
    ctx.moveTo(x + borderRadius, y); // top left corner, right end
    ctx.lineTo(x + size - borderRadius, y); // top line
    ctx.quadraticCurveTo(x + size, y, x + size, y + borderRadius); // top right corner
    ctx.lineTo(x + size, y + size - borderRadius); // right line
    ctx.quadraticCurveTo(x + size, y + size, x + size - borderRadius, y + size); // bottom right corner
    ctx.lineTo(x + borderRadius, y + size); // bottom line
    ctx.quadraticCurveTo(x, y + size, x, y + size - borderRadius); // bottom left corner
    ctx.lineTo(x, y + borderRadius); // left line
    ctx.quadraticCurveTo(x, y, x + borderRadius, y); // top left corner
    ctx.closePath();

    ctx.fillStyle = '#f3ecd1';
    ctx.fill();

    ctx.drawImage(
        targetIconSprite,
        x - 8, y - 8
    );

}