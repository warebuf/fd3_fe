

import type { GameState } from "../../engine/gameState"



export function drawStructures( 
    ctx: CanvasRenderingContext2D, 
    canvasWidth: number, 
    canvasHeight: number, 
    currentState: GameState,
    teamIdx: number,
    bitmap: ImageBitmap
): void {

    ctx.font = `12px sans-serif`;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let playerStructures = [];
    let oppStructures = [];

    for(let i = 0; i < currentState.StructureHP.length; i++) {
        if(teamIdx === currentState.StructureTeam[i]) { playerStructures.push(i); } 
        else { oppStructures.push(i); }
    }

    // num * size + (num - 1) * gap
    const gap = 10;
    const size = 100;
    const totalPlayerWidth = playerStructures.length * size + (playerStructures.length - 1) * gap;
    const totalOppWidth = oppStructures.length * size + (oppStructures.length - 1) * gap;
    const startPlayerX = (size / 2) + (canvasWidth - totalPlayerWidth) / 2;
    const startOppX = (size / 2) + (canvasWidth - totalOppWidth) / 2;

    // calculate y, assume sprite height is 100
    const playerY = (canvasHeight/2) + 200;
    const oppY = (canvasHeight/2) - 200;

    for(let i = 0; i < playerStructures.length; i++) {
        const idx = playerStructures[i];
        ctx.drawImage(bitmap, startPlayerX + i*(gap + size), playerY);
        ctx.fillText(currentState.StructureHP[idx].toLocaleString(), startPlayerX + i*(gap + size), playerY + size + gap);
    }

    for(let i = 0; i < oppStructures.length; i++) {
        const idx = oppStructures[i];
        ctx.drawImage(bitmap, startPlayerX + i*(gap + size), oppY - size - gap);
        ctx.fillText(currentState.StructureHP[idx].toLocaleString(), startOppX + i*(gap + size), oppY);
    }
    
}