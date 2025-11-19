


const size = 36;
const borderRadius = 10;

// x, y is the center of the card
export function drawCard(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean, backside: boolean) {

    // shift from top left corner to center
    x = x - (size / 2);
    y = y - (size / 2);

    // draw background card
    ctx.beginPath();
    ctx.moveTo(x + borderRadius, y); // top left corner, right end
    ctx.lineTo(x + size - borderRadius, y); // top line
    ctx.quadraticCurveTo(x + size, y, x + size, y + borderRadius); // top right corner
    ctx.lineTo(x + size, y + size - borderRadius); // right line
    ctx.quadraticCurveTo(x + size, y + size, x + size - borderRadius, y + size); // bottom right corner
    ctx.lineTo(x + borderRadius, y + size); // bottom line
    ctx.quadraticCurveTo(x, y + size, x, y + size - borderRadius); // bottom left corner
    ctx.lineTo(x, y + borderRadius); // left line
    ctx.quadraticCurveTo(x, y, x + borderRadius, y); // top left corner
    ctx.closePath();

    ctx.fillStyle = 'black';
    ctx.fill();

    if(on) { ctx.strokeStyle = '#C5C6D0'; }
    else { ctx.strokeStyle = '#404040'; } // try 404040, 595959, or 666666 to test tone
    ctx.lineWidth = 1;
    ctx.stroke();

    // draw centered text
    if(backside) {
        ctx.fillStyle = "white"
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("FD", x + size / 2, y + size / 2);
    }
    
}