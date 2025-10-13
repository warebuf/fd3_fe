<script lang="ts">

  import { onMount } from "svelte";

  import { drawTime } from "./engine/drawTime";
  
  import { increment, decrement } from "./keys/arrows";

  import type { Sprite } from "$lib/sprites/sprites";
  import { createSprites, drawSprites } from "$lib/sprites/sprites";



  let canvasEl: HTMLCanvasElement; // saved for reshapes
  let ctx: CanvasRenderingContext2D;
  let animationID: number; // saved for easy cleanup
  let ws: WebSocket;

  let sprites: Sprite[];
  let activeSprite: {idx: number, imgIdx: number}

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

    drawSprites(ctx, sprites, activeSprite, width, height);

    // schedule next frame
    animationID = requestAnimationFrame(loop);
  }

  function onKey(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        console.log('left');
        activeSprite = decrement(sprites, activeSprite);
        const k1 = Object.keys(sprites[activeSprite.idx].images);
        console.log(k1[activeSprite.imgIdx])
        console.log("data", sprites[activeSprite.idx].instructions[k1[activeSprite.imgIdx]].data)
        console.log("duration", sprites[activeSprite.idx].instructions[k1[activeSprite.imgIdx]].duration)
        console.log("\n")
        break;

      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        console.log('right');
        activeSprite = increment(sprites, activeSprite);
        const k2 = Object.keys(sprites[activeSprite.idx].images);
        console.log(k2[activeSprite.imgIdx])
        console.log("data", sprites[activeSprite.idx].instructions[k2[activeSprite.imgIdx]].data)
        console.log("duration", sprites[activeSprite.idx].instructions[k2[activeSprite.imgIdx]].duration)
        console.log("\n")
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
      const characters = ['bulbasaur', 'missingno', 'pidgey', 'sandshrew', 'sandslash', ]

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
      sprites = await createSprites(spriteActionsJSON);
      activeSprite = {idx: 0, imgIdx: 0}

      // guard against requestAnimationFrame
      if (cancelled) return;

      // start the game loop once everything loads
      loop(); 

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