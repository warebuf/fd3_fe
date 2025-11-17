
import type { GameState } from "../../engine/gameState"
import type { Atlas } from "$lib/sprites/sprite2"

import { drawCard } from "../indiv/drawCard"
import { drawSprite } from "../indiv/drawSprite";

export function drawField(
  atlasMap: Record<number, Atlas>,
  modelAnimations: Record<number, { name: string; anims: string[] }>,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  currentState: GameState,
  teamIdx: number,
): void {

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // === Draw red dot in the center ===
  const radius = 1;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();

  // create the arrays
  let botArr = []; // arr of unitIdxs
  let topArr = [];
  for(let i = 0; i < currentState.FieldUnits.length; i++) {
    const unitIdx = currentState.FieldUnits[i];
    if(currentState.HP[unitIdx] > 0) {
      if(currentState.Team[unitIdx] === teamIdx) { botArr.push(unitIdx); } 
      else { topArr.push(unitIdx); }
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
    drawCard(ctx, x, centerY + 50, false);

    const modelNo = currentState.ModelNo[botArr[i]];
    const animationString = modelAnimations[modelNo].anims[1];
    drawSprite(atlasMap[modelNo], animationString, ctx, x, centerY + 50, 0);
  }

  // draw top row
  for (let i = 0; i < topArr.length; i++) {
    const x = topLeftCenter + i * (lineWidth + gap);
    drawCard(ctx, x, centerY - 50, false);

    const modelNo = currentState.ModelNo[topArr[i]];
    const animationString = modelAnimations[modelNo].anims[1];
    drawSprite(atlasMap[modelNo], animationString, ctx, x, centerY - 50, 4);
  }

  // draw
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "10px sans-serif";

  // draw nums
  for (let i = 0; i < botArr.length; i++) {
    const x = botLeftCenter + i * (lineWidth + gap);
    ctx.fillText( String(botArr[i]), x, centerY + 50 );
  }

  for (let i = 0; i < topArr.length; i++) {
    const x = topLeftCenter + i * (lineWidth + gap);
    ctx.fillText( String(topArr[i]), x, centerY - 50 );
  }

}
