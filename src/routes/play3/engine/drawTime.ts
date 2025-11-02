


export function drawTime(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const now = new Date();
    const timeString = now.toLocaleTimeString(); // e.g. "11:32:10 PM"

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(timeString, width / 2, height / 10);
}