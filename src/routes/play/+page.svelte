<script lang="ts">

  import { onMount } from "svelte";

  import { drawTime } from "$lib/engine/drawTime";

  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationID: number; // saved for easy cleanup
  let ws: WebSocket;

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

    // canvas element setup
    ctx = canvasEl.getContext("2d")!;
    resizeCanvas();                       
    window.addEventListener("resize", resizeCanvas);

    // websocket setup
    ws = new WebSocket("ws://localhost:3000/ws");

    ws.addEventListener("open", () => {
      console.log("✅ Connected to server");
      ws.send("Hello server!");
    });

    ws.addEventListener("message", (event) => {
      console.log("📩 Message from server:", event.data);
      
    });

    ws.addEventListener("close", () => {
      console.log("❌ Connection closed");
    });

    ws.addEventListener("error", (err) => {
      console.error("⚠️ WebSocket error", err);
    });

    // game loop
    loop();

    // cleanup
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