
import type { GameState } from "../engine/gameState"

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

  // draw
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "10px sans-serif";

  const lineWidth = 24;
  const botLeftCenter = centerX - ((botArr.length - 1) * lineWidth) / 2;
  const topLeftCenter = centerX - ((topArr.length - 1) * lineWidth) / 2;
  for (let i = 0; i < botArr.length; i++) {
    ctx.fillText( String(botArr[i]), botLeftCenter + i * lineWidth, centerY + 50 );
  }
  for (let i = 0; i < topArr.length; i++) {
    ctx.fillText( String(topArr[i]), topLeftCenter + i * lineWidth, centerY - 50 );
  }

}
