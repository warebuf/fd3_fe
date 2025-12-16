

import type { GameState } from "../../engine/gameState"
import type { Atlas, SpriteDesc } from "$lib/sprites/sprite2"

import { drawCard } from "../indiv/drawCard"
import { drawSprite } from "../indiv/drawSprite";
import { drawHP } from "../indiv/drawHP";

export const BENCH = { size: 36, radius: 10, gap: 2 };

export function drawBench( 
  ctx: CanvasRenderingContext2D, 
  canvasWidth: number, 
  canvasHeight: number, 
  currentState: GameState,
  teamIdx: number,
  hoverIdx: number,
  atlasMap: Record<number, Atlas>,
  sprites: SpriteDesc[],
): void {

  let count = 0;
  let oppCount = 0;
  let benchUnits : number[] = []; // save idx
  for(let i = 0; i < currentState.Team.length; i++) {
    if( currentState.Zone[i] === 0 || currentState.Zone[i] === 3 ) { // on bench
      if(currentState.Team[i] === teamIdx) {
        benchUnits.push(i);
        count++;
      } else {
        oppCount++;
      }
    }
  }

  const size = BENCH.size;       // box size
  const gap = BENCH.gap;         // spacing between boxes

  // draw player bench
  const totalWidth = count * size + (count - 1) * gap;
  const startX = (canvasWidth - totalWidth) / 2;

  const centerY = (canvasHeight / 2);


  for (let i = 0; i < count; i++) {
    const x = startX + i * (size + gap);
    drawCard(ctx, x+(size/2), centerY + 150, benchUnits[i]===hoverIdx, false, currentState.Zone[i]===3);

    const modelNo = currentState.ModelNo[benchUnits[i]];
    drawSprite(ctx, x+(size/2), centerY + 150, atlasMap[modelNo], currentState.Zone[benchUnits[i]], sprites[benchUnits[i]], true);

    drawHP(ctx, x+(size/2), centerY + 150, currentState.HP[benchUnits[i]]);
  }

  // draw opponent bench
  const oppTotalWidth = oppCount * size + (oppCount - 1) * gap;
  const oppStartX = (canvasWidth - oppTotalWidth) / 2;
  for(let i = 0; i < oppCount; i++) {
    const x = oppStartX + i * (size + gap);
    drawCard(ctx, x+(size/2), centerY - 118, false, true, false);
  }

}

export function benchHitTest(canvasHeight: number, px: number, py: number, width: number, height: number, playerBench: number[]): number {
  
  const { size, gap } = BENCH;
  const count = playerBench.length;
  
  const totalWidth = count * size + (count - 1) * gap;
  const startX = (width - totalWidth) / 2;
  const centerY = (canvasHeight / 2);
  const y = centerY + 150;

  for (let i = 0; i < count; i++) {
    const x = startX + i * (size + gap);
    if (px >= x && px <= x + size && py >= y - (size/2) && py <= y + (size/2)) return playerBench[i];
  }
  
  return -1;
}

