<script lang="ts">
  import { onMount } from "svelte";

  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let dpr: number;

  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    const { width, height } = canvasEl.getBoundingClientRect();
    canvasEl.width  = Math.max(1, Math.round(width  * dpr));
    canvasEl.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    const w = canvasEl.clientWidth;
    const h = canvasEl.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // centered square
    let size = 120;                 
    let x = (w - size) / 2;
    let y = (h - size) / 2;
    ctx.fillStyle = "red";
    ctx.fillRect(x, y, size, size);

    // optional: 1 device-pixel border
    size = 60;                 
    x = (w - size) / 2;
    y = (h - size) / 2;
    ctx.lineWidth = 1 / dpr;
    ctx.strokeStyle = "white";
    ctx.strokeRect(
      x + 0.5 / dpr,
      y + 0.5 / dpr,
      size - 1 / dpr,
      size - 1 / dpr
    );
  }

  onMount(() => {
    ctx = canvasEl.getContext("2d")!;
    resizeCanvas();                       
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  });

</script>
  
<style>  

  .wrap {
    flex: 1;
    min-height: 0;
    display: flex;
  }

  canvas {
    width: 100%;
    height: 100%;
    display: block;
    background: #222;
  }
</style>

<div class="wrap">
  <canvas bind:this={canvasEl}></canvas>
</div>