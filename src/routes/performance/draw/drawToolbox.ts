

import type { Atlas } from "$lib/sprites/sprite2"

export const BENCH = { size: 36, radius: 10, gap: 2, bottomPad: 10 };

let toolboxSize = 0;

export function drawToolbox( 
  ctx: CanvasRenderingContext2D, 
  canvasWidth: number, 
  canvasHeight: number,
  atlasMap: Record<number, Atlas>,
): void {

    let x = 0;
    let y = 0;

    let i = 0;
    while(true) {
        if( i in atlasMap ) {

            const atlas = atlasMap[i];
            const frameHeight = atlas.instructions[0].FrameHeight;
            const frameWidth = atlas.instructions[0].FrameWidth;

            ctx.drawImage(
                atlas.images[0], 
                0, 0, // top left corner of frame
                frameWidth, frameHeight, // frame dimensions
                x, y, // destination coordinates
                frameWidth, frameHeight, // destination dimensions
            );

            y += BENCH.size;

        } else {
            toolboxSize = i;
            break;
        }
        i += 1;
    }

}

export function toolboxHitTest( px: number, py: number, width: number, height: number ): number {
  
    if(px > BENCH.size) { return -1; }

    const idx = Math.floor(py / BENCH.size);

    if(idx < toolboxSize) { return idx; } 
  
    return -1;
}

