
import { get } from "svelte/store";
import { serverClockOffset } from "../../networking/ping";

export function drawNextRoundCount(  
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    nextRoundTime: Date
) : boolean {

    const timeLeft = nextRoundTime.getTime() - Date.now() - get(serverClockOffset);
    
    if ( timeLeft <= 0 ) {
        return false
    }

    const timeLeftSec = (timeLeft / 1000).toFixed(1);
    const text = "Match starts in " + timeLeftSec + " seconds"
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";

    // Fill on top
    ctx.fillStyle = "white";
    ctx.fillText(text, 10, canvasHeight - 10);    
    return true
}