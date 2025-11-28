

import type { GameState } from "../../engine/gameState"
import type { Atlas, SpriteDesc } from "$lib/sprites/sprite2"
import { drawCard } from "../indiv/drawCard"
import { drawSprite } from "../indiv/drawSprite";
import { drawHP } from "../indiv/drawHP";
import { drawIdx } from "../indiv/drawIdx";

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

  const lineWidth = 36;
  const gap = 2;

  // total span for N cards
  const totalBotWidth = (botArr.length - 1) * (lineWidth + gap);
  const totalTopWidth = (topArr.length - 1) * (lineWidth + gap);

  // leftmost center position
  const botLeftCenter = centerX - totalBotWidth / 2;
  const topLeftCenter = centerX - totalTopWidth / 2;

  // draw bottom row
  for (let i = 0; i < botArr.length; i++) {
    const x = botLeftCenter + i * (lineWidth + gap);
    drawCard(ctx, x, centerY + 50, false, false);

    const modelNo = currentState.ModelNo[botArr[i]];
    drawSprite(ctx, x, centerY + 50, atlasMap[modelNo], 1, sprites[botArr[i]], true);

    drawHP(ctx, x, centerY + 50, currentState.HP[botArr[i]]);

    drawIdx(ctx, x, centerY + 25, botArr[i]);

  }

  // draw top row
  for (let i = 0; i < topArr.length; i++) {
    const x = topLeftCenter + i * (lineWidth + gap);
    drawCard(ctx, x, centerY - 50, false, false);

    const modelNo = currentState.ModelNo[topArr[i]];
    drawSprite(ctx, x, centerY - 50, atlasMap[modelNo], 1, sprites[topArr[i]], false);

    drawHP(ctx, x, centerY - 50, currentState.HP[topArr[i]]);

    drawIdx(ctx, x, centerY - 75, topArr[i]);

  }

}
