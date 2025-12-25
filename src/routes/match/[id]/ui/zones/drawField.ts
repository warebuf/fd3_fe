

import type { GameState } from "../../engine/gameState"
import type { Atlas, SpriteDesc } from "$lib/sprites/sprite2"
import { drawCard } from "../indiv/drawCard"
import { drawSprite } from "../indiv/drawSprite";
import { drawHP } from "../indiv/drawHP";
import { drawCharge2 } from "../indiv/drawCharge";


const lineWidth = 36;
const gap = 2;

export function drawField(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  currentState: GameState,
  teamIdx: number,
  atlasMap: Record<number, Atlas>,
  sprites: SpriteDesc[],
): void {

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // create the arrays
  let botArr = []; // arr of unit idexes
  let topArr = [];
  for(let i = 0; i < currentState.Zone.length; i++) {
    if(currentState.Zone[i] === 1 && currentState.HP[i] > 0) { // 1 is field
      if(currentState.Team[i] === teamIdx) { botArr.push(i); } 
      else { topArr.push(i); }
    }
  }

  // total span for N cards
  const totalBotWidth = (botArr.length - 1) * (lineWidth + gap);
  const totalTopWidth = (topArr.length - 1) * (lineWidth + gap);

  // leftmost center position
  const botLeftCenter = centerX - totalBotWidth / 2;
  const topLeftCenter = centerX - totalTopWidth / 2;

  // draw bottom row
  for (let i = 0; i < botArr.length; i++) {
    const x = botLeftCenter + i * (lineWidth + gap);
    drawCard(ctx, x, centerY + 50, false, false, false);

    const modelNo = currentState.ModelNo[botArr[i]];
    drawSprite(ctx, x, centerY + 50, atlasMap[modelNo], currentState.Zone[botArr[i]], sprites[botArr[i]], true);
    drawHP(ctx, x, centerY + 50, currentState.HP[botArr[i]]);
    drawCharge2(ctx, x, centerY + 50, currentState, botArr[i]);

  }

  // draw top row
  for (let i = 0; i < topArr.length; i++) {
    const x = topLeftCenter + i * (lineWidth + gap);
    drawCard(ctx, x, centerY - 50, false, false, false);

    const modelNo = currentState.ModelNo[topArr[i]];
    drawSprite(ctx, x, centerY - 50, atlasMap[modelNo], currentState.Zone[topArr[i]], sprites[topArr[i]], false);
    drawHP(ctx, x, centerY - 50, currentState.HP[topArr[i]]);
    drawCharge2(ctx, x, centerY - 50, currentState, topArr[i]);
    
  }

}

export function fieldHitTest(px: number, py: number, width: number, height: number, teamIdx: number, state: GameState): number {
  
  const centerX = width / 2;
  const centerY = height / 2;

  if( (py >= centerY - 50 - (lineWidth / 2)) && (py <= centerY - 50 + (lineWidth / 2)) ) {

    const topArr : number[] = [];
    for(let i = 0; i < state.ModelNo.length; i++) {
      if( state.Zone[i] === 1 && state.HP[i] > 0) {
        if (state.Team[i] !== teamIdx) { topArr.push(i); }
      }
    }
    const topWidth = (topArr.length * lineWidth) + (topArr.length > 0 ? (topArr.length - 1) * gap : 0);
    const leftmost = centerX - (topWidth / 2);
    for(let i = 0; i < topArr.length; i++) {
      const left = leftmost + (i * (gap + lineWidth));
      const right = left + lineWidth;
      console.log(i, left, right)
      if( px >= left && px <= right) { return topArr[i] };
    }

  } else if ( (py >= centerY + 50 - (lineWidth / 2)) && (py <= centerY + 50 + (lineWidth / 2)) ) {

    const botArr : number[] = [];
    for(let i = 0; i < state.ModelNo.length; i++) {
      if( state.Zone[i] === 1 && state.HP[i] > 0) {
        if (state.Team[i] === teamIdx) { botArr.push(i); } 
      }
    }
    const botWidth = (botArr.length * lineWidth) + (botArr.length > 0 ? (botArr.length - 1) * gap : 0);
    const leftmost = centerX - (botWidth / 2);
    for(let i = 0; i < botArr.length; i++) {
      const left = leftmost + (i * (gap + lineWidth));
      const right = left + lineWidth;
      if( px >= left && px <= right) { return botArr[i] };
    }

  } 
  return -1;
}
