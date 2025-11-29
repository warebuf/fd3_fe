


const size = 36;

// x, y is the center of the card
export function drawHP(ctx: CanvasRenderingContext2D, x: number, y: number, HP: number) {

    ctx.fillStyle = "white"
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    //ctx.fillText(HP.toString(), x, y - (size / 2) - 8 ); // draw at top
    ctx.fillText(HP.toString(), x, y + (size / 2) + 10  ); // draw at bottom

}