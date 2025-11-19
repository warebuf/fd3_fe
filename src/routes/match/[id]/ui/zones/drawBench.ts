

import type { GameState } from "../../engine/gameState"
import { drawCard } from "../indiv/drawCard"

export const BENCH = { size: 36, radius: 10, gap: 2, bottomPad: 10 };

export function drawBench( 
  ctx: CanvasRenderingContext2D, 
  canvasWidth: number, 
  canvasHeight: number, 
  currentState: GameState,
  teamIdx: number,
  hoverIdx: number
): void {

  let count = 0;
  let benchUnits : Number[] = []; // save idx
  for(let i = 0; i < currentState.Team.length; i++) {
    if(currentState.Team[i] === teamIdx && currentState.Zone[i] === 0) { // on bench
      benchUnits.push(i);
      count++;
    }
  }

  const size = BENCH.size;       // box size
  const gap = BENCH.gap;         // spacing between boxes
  const bottomPad = BENCH.bottomPad;

  const totalWidth = count * size + (count - 1) * gap;
  const startX = (canvasWidth - totalWidth) / 2;
  const y = canvasHeight - size - bottomPad;

  for (let i = 0; i < count; i++) {
    const x = startX + i * (size + gap);
    drawCard(ctx, x+(size/2), y, (i===hoverIdx), true);
  }

}

export function benchHitTest(px: number, py: number, width: number, height: number, count: number): number {
  
  const { size, gap, bottomPad } = BENCH;
  
  const totalWidth = count * size + (count - 1) * gap;
  const startX = (width - totalWidth) / 2;
  const y = height - size - bottomPad;

  for (let i = 0; i < count; i++) {
    const x = startX + i * (size + gap);
    if (px >= x && px <= x + size && py >= y - (size/2) && py <= y + (size/2)) return i;
  }
  return -1;
}

