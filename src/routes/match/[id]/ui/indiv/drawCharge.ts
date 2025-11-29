

import type { GameState } from "../../engine/gameState"

const size = 36;

// x, y is the center of the card
export function drawCharge(ctx: CanvasRenderingContext2D, x: number, y: number, state: GameState, unitIdx : number) {

    // shift from top left corner to center
    x = x - (size / 2);
    y = y - (size / 2);

    ctx.fillStyle = "white"
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for(let i = state.AbilityStartIdx[unitIdx]; i < state.AbilityStartIdx[unitIdx] + state.AbilityCount[unitIdx]; i++) {
        
        const charge = state.AbilityCharge[i];
        const SPD = state.AbilitySPD[i];
        const count = state.AbilityStartIdx[unitIdx] - i;

        ctx.fillText(charge.toString() + " / " + SPD.toString(), x + (size / 2), y + (size / 2) + (10*size/8) + (count * 18));

    }
    
}