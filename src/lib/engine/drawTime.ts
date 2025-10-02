

export function drawRandomSquare(ctx: CanvasRenderingContext2D, width: number, height: number) {

    const size = 50 + Math.random() * 150;
    const x = (width - size) / 2;
    const y = (height - size) / 2;

    ctx.fillStyle = "green";
    ctx.fillRect(x, y, size, size);

}