
import type { GameState } from "../engine/gameState"

import { drawCard } from "./drawCard"

export function drawField(
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
  }

  // draw top row
  for (let i = 0; i < topArr.length; i++) {
    const x = topLeftCenter + i * (lineWidth + gap);
    drawCard(ctx, x, centerY - 50, false);
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
