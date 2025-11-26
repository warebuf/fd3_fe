

import type { GameState } from "../../engine/gameState"
import type { Atlas, SpriteDesc } from "$lib/sprites/sprite2"

import { drawCard } from "../indiv/drawCard"
import { drawSprite } from "../indiv/drawSprite";
import { drawHP } from "../indiv/drawHP";

export const BENCH = { size: 36, radius: 10, gap: 2, bottomPad: 10 };

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
    if(currentState.Zone[i] === 0) { // on bench
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
  const bottomPad = BENCH.bottomPad;

  // draw player bench
  const totalWidth = count * size + (count - 1) * gap;
  const startX = (canvasWidth - totalWidth) / 2;
  const y = canvasHeight - size - bottomPad;
  for (let i = 0; i < count; i++) {
    const x = startX + i * (size + gap);
    drawCard(ctx, x+(size/2), y, (benchUnits[i]===hoverIdx), false);

    const modelNo = currentState.ModelNo[benchUnits[i]];
    drawSprite(ctx, x+(size/2), y, atlasMap[modelNo], 0, sprites[benchUnits[i]], true);

    drawHP(ctx, x+(size/2), y, currentState.HP[benchUnits[i]]);
  }

  // draw opponent bench
  const oppTotalWidth = oppCount * size + (oppCount - 1) * gap;
  const oppStartX = (canvasWidth - oppTotalWidth) / 2;
  for(let i = 0; i < oppCount; i++) {
    const x = oppStartX + i * (size + gap);
    drawCard(ctx, x+(size/2), 40, false, true);
  }

}

export function benchHitTest(px: number, py: number, width: number, height: number, playerBench: number[]): number {
  
  const { size, gap, bottomPad } = BENCH;
  const count = playerBench.length;
  
  const totalWidth = count * size + (count - 1) * gap;
  const startX = (width - totalWidth) / 2;
  const y = height - size - bottomPad;

  for (let i = 0; i < count; i++) {
    const x = startX + i * (size + gap);
    if (px >= x && px <= x + size && py >= y - (size/2) && py <= y + (size/2)) return playerBench[i];
  }
  
  return -1;
}

