

export const BENCH = { size: 36, radius: 10, gap: 2, bottomPad: 10 };

export function drawBench( ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, count: number, hoverIdx: number): void {

  const size = BENCH.size;       // box size
  const radius = BENCH.radius;     // corner radius
  const gap = BENCH.gap;         // spacing between boxes
  const bottomPad = BENCH.bottomPad;

  const totalWidth = count * size + (count - 1) * gap;
  const startX = (canvasWidth - totalWidth) / 2;
  const y = canvasHeight - size - bottomPad;

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

    if(hoverIdx === i) { ctx.strokeStyle = '#C5C6D0'; }
    else { ctx.strokeStyle = '#404040'; } // try 404040, 595959, or 666666 to test tone
    
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}


export function benchHitTest(px: number, py: number, width: number, height: number, count: number): number {
  
  const { size, gap, bottomPad } = BENCH;
  
  const totalWidth = count * size + (count - 1) * gap;
  const startX = (width - totalWidth) / 2;
  const y = height - size - bottomPad;

  for (let i = 0; i < count; i++) {
    const x = startX + i * (size + gap);
    if (px >= x && px <= x + size && py >= y && py <= y + size) return i;
  }
  return -1;
}

