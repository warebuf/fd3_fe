
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

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "10px sans-serif";

  // Draw each number with slight vertical spacing
  const lineHeight = 24;
  const totalHeight = currentState.FieldUnits.length * lineHeight;
  const startY = centerY - totalHeight / 2;

  for(let i = 0; i < currentState.FieldUnits.length; i++) {
    if(teamIdx === currentState.Team[i]) {
      ctx.fillText(String(i), centerX, startY + i * lineHeight - 50);
    } else {
      ctx.fillText(String(i), centerX, startY + i * lineHeight + 50);
    }
  }

}
