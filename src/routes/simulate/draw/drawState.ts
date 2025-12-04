

import type { Atlas } from "$lib/sprites/sprite2"
import type { GameState } from "../../match/[id]/engine/gameState"

export const BENCH = { size: 36, radius: 10, gap: 2, bottomPad: 10 };

let bench1Count = 0;
let bench2Count = 0;
let field1Count = 0;
let field2Count = 0;

export function drawState( 
  ctx: CanvasRenderingContext2D,
  atlasMap: Record<number, Atlas>,
  state: GameState
): void {

    let x = 200;
    let y = 0;

    for(let i = 0; i < state.ModelNo.length; i++) {
        
        if(state.HP[i] > 0) {

            const modelNo = state.ModelNo[i];

            const atlas = atlasMap[modelNo];
            const frameHeight = atlas.instructions[0].FrameHeight;
            const frameWidth = atlas.instructions[0].FrameWidth;

            let destX = x;
            let destY = y;
            if(state.Team[i] === 0) { 
                if(state.Zone[i] === 0) {
                    destX += bench1Count * 36; 
                    destY += 36 * 3;
                } 
                else if(state.Zone[i] === 1) { 
                    destX += field1Count * 36; 
                    destY += 36 * 2; 
                }
            } else {
                if(state.Zone[i] === 0) { 
                    destX += bench2Count * 36; 
                    destY += 36 * 0; 
                } 
                else if(state.Zone[i] === 1) { 
                    destX += field2Count * 36; 
                    destY += 36 * 1; 
                }
            }

            ctx.strokeStyle = "white";
            ctx.strokeRect(destX,destY,36,36);
            ctx.strokeText("100", destX, destY+36);

            ctx.drawImage(
                atlas.images[0], 
                0, 0, // top left corner of frame
                frameWidth, frameHeight, // frame dimensions
                destX, destY, // destination coordinates
                frameWidth, frameHeight, // destination dimensions
            );

            if(state.Team[i] === 0) { 
                if(state.Zone[i] === 0) { bench1Count += 1; } 
                else if(state.Zone[i] === 1) { field1Count += 1; }
            } else {
                if(state.Zone[i] === 0) { bench2Count += 1; } 
                else if(state.Zone[i] === 1) { field2Count += 1; }
            }

        }

        
    }

            


}
