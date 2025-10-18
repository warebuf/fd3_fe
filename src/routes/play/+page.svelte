<script lang="ts">

  import { onMount } from "svelte";

  import { drawTime } from "./engine/drawTime";
  
  import { increment, decrement } from "./keys/arrows";

  import type { Atlas, Sprite } from "$lib/sprites/sprites";
  import { createAtlases, drawSprites } from "$lib/sprites/sprites";



  let canvasEl: HTMLCanvasElement; // saved for reshapes
  let ctx: CanvasRenderingContext2D;
  let animationID: number; // saved for easy cleanup
  let ws: WebSocket;
  let lastTime = performance.now(); // tracks frame time

  let atlases: Atlas[];
  let activeSprite: Sprite;



  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvasEl.getBoundingClientRect();
    canvasEl.width  = Math.max(1, Math.round(width  * dpr));
    canvasEl.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function loop(now: number) {

    const dt = now - lastTime; // ms since last frame
    lastTime = now;

    const width = canvasEl.clientWidth;
    const height = canvasEl.clientHeight;
    ctx.clearRect(0, 0, width, height);

    drawTime(ctx, width, height);

    drawSprites(ctx, atlases, activeSprite, width, height, dt);

    // schedule next frame
    animationID = requestAnimationFrame(loop);
  }

  function onKey(e: KeyboardEvent) {
    switch (e.key) {
      case ',':
        e.preventDefault();
        decrement(atlases, activeSprite);
        break;

      case '.':
        e.preventDefault();
        increment(atlases, activeSprite);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        activeSprite.direction -= 1;
        if(activeSprite.direction < 0) {activeSprite.direction = 7;}
        break;
      
      case 'ArrowRight':
        e.preventDefault();
        activeSprite.direction += 1;
        if(activeSprite.direction > 7) {activeSprite.direction = 0;}
        break;

      default:
        break;
    }
  }

  onMount(() => {

    // canvas element setup
    ctx = canvasEl.getContext("2d")!;
    resizeCanvas();                       
    window.addEventListener("resize", resizeCanvas);

    // keys setup
    window.addEventListener('keydown', onKey);

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

    let cancelled = false; 
    (async () => { 

      // 
      const characters = [ 'bulbasaur', 'missingno' ]

      // server call, get list of sheet paths for a character
      // NOTE: instead of a server call, this could just be a JSON
      const spriteActionsRequest = await fetch('/api/sprites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characters: characters })
      });

      // get list of sprite sheets
      const spriteActionsJSON = await spriteActionsRequest.json();

      // character setup 
      atlases = await createAtlases(spriteActionsJSON);
      activeSprite = {atlasIdx: 0, imgIdx: 0, durationIdx: 0, frameTime: 0, direction: 0}

      // guard against requestAnimationFrame
      if (cancelled) return;

      // start the game loop once everything loads
      animationID = requestAnimationFrame(loop);

    })();

    // cleanup on unmount
    return () => {
      cancelled = true;
      cancelAnimationFrame(animationID);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener('keydown', onKey);
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