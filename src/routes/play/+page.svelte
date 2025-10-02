<script lang="ts">
  import { onMount } from "svelte";

  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let dpr: number; // device pixel ratio
  let animationID: number; // saved for easy cleanup

  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    const { width, height } = canvasEl.getBoundingClientRect();
    canvasEl.width  = Math.max(1, Math.round(width  * dpr));
    canvasEl.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function loop() {
    const w = canvasEl.clientWidth;
    const h = canvasEl.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // pick random square size [50–200]
    const size = 50 + Math.random() * 150;
    const x = (w - size) / 2;
    const y = (h - size) / 2;

    ctx.fillStyle = "red";
    ctx.fillRect(x, y, size, size);

    // schedule next frame
    animationID = requestAnimationFrame(loop);
  }

  onMount(() => {
    ctx = canvasEl.getContext("2d")!;
    resizeCanvas();                       
    window.addEventListener("resize", resizeCanvas);

    loop();


    return () => {
      cancelAnimationFrame(animationID);
      window.removeEventListener("resize", resizeCanvas);
    };

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