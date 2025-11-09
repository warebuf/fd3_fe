<script lang="ts">

    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { connectWS } from "./networking/ws";
    import { ping } from "./networking/pingStore";
    import { stopPing } from "./networking/ping";
    import { sendBenchMove } from "./networking/eventTypes";


    import { drawBench, benchHitTest } from "./ui/bench"

    import type { Atlas } from "$lib/sprites/sprites";
    import { createAtlases } from "$lib/sprites/sprites";
    import { drawIdles } from "$lib/sprites/drawIdles";


    let canvasEl: HTMLCanvasElement; // saved for reshapes
    let ctx: CanvasRenderingContext2D;
    let animationID: number; // saved for easy cleanup
    let lastTime = performance.now(); // tracks frame time

    let atlases: Atlas[];
    let benchAnimation: string[] = [];

    let hoverIdx: number = -1;

    let matchID: string;
    $: matchID = $page.params.id!;

    let ws: WebSocket | undefined;
  
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

        drawBench(ctx, width, height, 2, hoverIdx);
        drawIdles(ctx, atlases, benchAnimation, width, height, dt);

        // schedule next frame
        animationID = requestAnimationFrame(loop);
    }

    onMount(() => {
            
        // canvas setup
        ctx = canvasEl.getContext("2d")!;
        resizeCanvas();                       
        window.addEventListener("resize", resizeCanvas);

        const onMove = (e: MouseEvent) => {
            const r = canvasEl.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;

            const idx = benchHitTest(x, y, canvasEl.clientWidth, canvasEl.clientHeight, benchAnimation.length || 2);
            hoverIdx = idx;
            canvasEl.style.cursor = idx >= 0 ? 'pointer' : 'default';
        };

        const onLeave = () => {
            hoverIdx = -1;
            canvasEl.style.cursor = 'default';
        };

        const onClick = (e: MouseEvent) => {
            const r = canvasEl.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;

            const idx = benchHitTest(x, y, canvasEl.clientWidth, canvasEl.clientHeight, benchAnimation.length || 2);
            if (idx >= 0 && ws) { sendBenchMove(ws, idx) };
        };

        canvasEl.addEventListener('mousemove', onMove);
        canvasEl.addEventListener('mouseleave', onLeave);
        canvasEl.addEventListener('click', onClick);

        let cancelled = false;
        (async () => { 

            // websocket setup
            ws = await connectWS(matchID);

            // init sprites
            const characters = [ 'bulbasaur', 'missingno' ]
            benchAnimation = ["Shake", "Hurt"]

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

            // guard against requestAnimationFrame
            if (cancelled) return;

            // start the game loop once everything loads
            animationID = requestAnimationFrame(loop);

        })();

        // cleanup on unmount
        return () => {
            cancelled = true;

            cancelAnimationFrame(animationID); // cancel animation loop
            stopPing(); // stop networking ping
            
            // stop listeners
            window.removeEventListener("resize", resizeCanvas); 
            canvasEl.removeEventListener('mousemove', onMove);
            canvasEl.removeEventListener('mouseleave', onLeave);
            canvasEl.removeEventListener('click', onClick);
        };

    });

</script>

<div class="ping" aria-live="polite">{$ping} ms</div>

<div class="wrap">
    <canvas bind:this={canvasEl}></canvas>
</div>

<style>
    .ping {
        position: fixed;
        top: 20px;
        right: 12px;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(6px);
        color: #fff;
        font: 600 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        pointer-events: none; /* don't block clicks underneath */
    }

    .wrap {
        flex: 1;
        min-height: 0;
        display: flex;
    }

    canvas {
        width: 100%;
        height: 100%;
        display: block;
        background: #1a1a1a;
    }
</style>