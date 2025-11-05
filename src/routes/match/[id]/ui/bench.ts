

export function drawBench(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  count: number // number of boxes
): void {
  const size = 36;       // box size
  const radius = 10;     // corner radius
  const gap = 1;         // spacing between boxes
  const totalWidth = count * size + (count - 1) * gap;
  const startX = (canvasWidth - totalWidth) / 2;
  const y = canvasHeight - size - 10;

  for (let i = 0; i < count; i++) {
    const x = startX + i * (size + gap);

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + size - radius, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
    ctx.lineTo(x + size, y + size - radius);
    ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
    ctx.lineTo(x + radius, y + size);
    ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fillStyle = 'black';
    ctx.fill();

    ctx.strokeStyle = '#404040'; // try 404040, 595959, or 666666 to test tone
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
