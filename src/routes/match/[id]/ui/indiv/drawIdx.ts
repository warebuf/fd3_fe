


// x, y is the center of the card
export function drawIdx(ctx: CanvasRenderingContext2D, x: number, y: number, Idx: number) {

    ctx.fillStyle = "red"
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    ctx.fillText(Idx.toString(), x, y);
    
}