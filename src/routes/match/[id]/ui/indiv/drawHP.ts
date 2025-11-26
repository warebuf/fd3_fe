


const size = 36;

// x, y is the center of the card
export function drawHP(ctx: CanvasRenderingContext2D, x: number, y: number, HP: number) {

    // shift from top left corner to center
    x = x - (size / 2);
    y = y - (size / 2);

    ctx.fillStyle = "white"
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(HP.toString(), x + (size / 2), y + (size / 2) + (7 * size / 8));
    
}