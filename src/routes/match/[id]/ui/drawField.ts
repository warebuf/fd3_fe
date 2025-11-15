
export function drawField(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  units: number[]
): void {

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "10px sans-serif";

  // Draw each number with slight vertical spacing
  const lineHeight = 24;
  const totalHeight = units.length * lineHeight;
  const startY = centerY - totalHeight / 2;

  units.forEach((num, i) => {
    ctx.fillText(String(num), centerX, startY + i * lineHeight);
  });
}
