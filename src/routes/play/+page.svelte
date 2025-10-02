<script lang="ts">

  import { onMount } from "svelte";

  import { drawTime } from "$lib/engine/drawTime";

  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationID: number; // saved for easy cleanup

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvasEl.getBoundingClientRect();
    canvasEl.width  = Math.max(1, Math.round(width  * dpr));
    canvasEl.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function loop() {
    const width = canvasEl.clientWidth;
    const height = canvasEl.clientHeight;
    ctx.clearRect(0, 0, width, height);

    drawTime(ctx, width, height);

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