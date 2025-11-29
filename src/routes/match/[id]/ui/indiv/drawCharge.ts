

import type { GameState } from "../../engine/gameState"

const size = 36;

// x, y is the center of the card
export function drawCharge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: GameState,
    unitIdx: number
  ) {
    // shift from top left corner to center
    x = x - size / 2;
    y = y - size / 2;
  
    // bar layout config
    const barWidth = size * 0.8;
    const barHeight = 6;
    const barGap = 3;
  
    // top of the first bar (roughly where your text used to be)
    const baseY = y + size + 4;
  
    for (
      let i = state.AbilityStartIdx[unitIdx];
      i < state.AbilityStartIdx[unitIdx] + state.AbilityCount[unitIdx];
      i++
    ) {
      const charge = state.AbilityCharge[i];
      const SPD = state.AbilitySPD[i];
      const count = i - state.AbilityStartIdx[unitIdx];
  
      // progress from 0 → 1
      let ratio = SPD > 0 ? charge / SPD : 0;
      if (ratio < 0) ratio = 0;
      if (ratio > 1) ratio = 1;
  
      const barX = x + size / 2 - barWidth / 2;
      const barY = baseY + count * (barHeight + barGap);
  
      // background bar
      ctx.fillStyle = "#333";
      ctx.fillRect(barX, barY, barWidth, barHeight);
  
      // filled portion
      ctx.fillStyle = "#4caf50";
      ctx.fillRect(barX, barY, barWidth * ratio, barHeight);
  
      // optional border
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
  }
  