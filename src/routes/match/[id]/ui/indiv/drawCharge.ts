

import type { GameState } from "../../engine/gameState"

const size = 36;

// x, y is the center of the card
export function drawCharge( ctx: CanvasRenderingContext2D, x: number, y: number, state: GameState, unitIdx: number ) {

    const barWidth = size * .8;
    const barHeight = 5;
    const barGap = 3;
    const baseY = y + (size / 2) + 20;
  
    for ( let i = state.AbilityStartIdx[unitIdx]; i < state.AbilityStartIdx[unitIdx] + state.AbilityCount[unitIdx]; i++ ) {
      const charge = state.AbilityCharge[i];
      const SPD = state.AbilitySPD[i];
      const count = i - state.AbilityStartIdx[unitIdx];
  
      // max SPD is 30 seconds?
      let SPDRatio = SPD / 30000;
      if (SPDRatio < 0) SPDRatio = 0;
      if (SPDRatio > 1) SPDRatio = 1;

      //
      let chargeRatio = SPD > 0 ? charge / SPD : 0;
      if (chargeRatio < 0) chargeRatio = 0;
      if (chargeRatio > 1) chargeRatio = 1;
  
      const barX = x - barWidth / 2;
      const barY = baseY + count * (barHeight + barGap);
  
      // background bar
      ctx.fillStyle = "#333";
      ctx.fillRect(barX, barY, barWidth, barHeight);
  
      // filled portion
      ctx.fillStyle = "#4caf50";
      ctx.fillRect(barX, barY, barWidth * chargeRatio, barHeight);
  
      // optional border
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
  }
  