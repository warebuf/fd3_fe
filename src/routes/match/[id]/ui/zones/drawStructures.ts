import type { GameState } from "../../engine/gameState";

let animTimeMs = 0;

// tune these
const FRAME_W = 100;
const FRAME_H = 100;
const FRAME_COUNT = 150;
const FPS = 9; // animation speed (frames per second)
const MS_PER_FRAME = 1000 / FPS;

export function drawStructures( ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, currentState: GameState, teamIdx: number, bitmap: ImageBitmap, deltaTimeMs: number ): void {
    
    animTimeMs += Math.min(deltaTimeMs, 100);

    const frameCount = Math.floor(animTimeMs / MS_PER_FRAME) % FRAME_COUNT;

    ctx.font = `12px sans-serif`;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const playerStructures: number[] = [];
    const oppStructures: number[] = [];

    for (let i = 0; i < currentState.StructureHP.length; i++) {
        if (teamIdx === currentState.StructureTeam[i]) playerStructures.push(i);
        else oppStructures.push(i);
    }

    const gap = 10;
    const size = 66;

    const totalPlayerWidth = playerStructures.length > 0 ? playerStructures.length * size + (playerStructures.length - 1) * gap : 0;
    const totalOppWidth = oppStructures.length > 0 ? oppStructures.length * size + (oppStructures.length - 1) * gap : 0;

    const startPlayerX = (size / 2) + (canvasWidth - totalPlayerWidth) / 2;
    const startOppX = (size / 2) + (canvasWidth - totalOppWidth) / 2;

    const playerY = canvasHeight / 2 + 250;
    const oppY = canvasHeight / 2 - 250;

    // (optional) clamp source rect so you don’t read past the bitmap
    const maxFramesInSheet = Math.floor(bitmap.width / FRAME_W);
    const safeFrame = Math.min(frameCount, Math.max(0, maxFramesInSheet - 1));

    for (let i = 0; i < playerStructures.length; i++) {
        const idx = playerStructures[i];
        const x = startPlayerX + i * (gap + size);

        ctx.drawImage(
            bitmap,
            safeFrame * FRAME_W, 0, FRAME_W, FRAME_H,
            x - size / 2, playerY - size / 2,
            size, size
        );

        ctx.fillText(currentState.StructureHP[idx].toLocaleString(), x, playerY + size / 2 + gap + 10);
    }

    for (let i = 0; i < oppStructures.length; i++) {
        const idx = oppStructures[i];
        const x = startOppX + i * (gap + size);

        ctx.drawImage(
            bitmap,
            safeFrame * FRAME_W, 0, FRAME_W, FRAME_H,
            x - size / 2, oppY - size / 2 - gap,
            size, size
        );

        ctx.fillText(currentState.StructureHP[idx].toLocaleString(), x, oppY + size / 2 + gap);
    }
}
