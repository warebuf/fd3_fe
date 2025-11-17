<script lang="ts">

    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { connectWS } from "./networking/ws";
    import { ping, stopPing } from "./networking/ping";

    import { sendBenchMove } from "./networking/eventTypes";
    import { getFullState } from "./networking/getState";
    import { StateManager } from "./engine/stateManager"
    import { initGameState, type GameState } from './engine/gameState';

    import { drawBench, benchHitTest } from "./ui/zones/drawBench"
    import { drawField } from "./ui/zones/drawField"

    import type { Atlas, SpriteDesc } from "$lib/sprites/sprite2";
    import { createAtlases2 } from "$lib/sprites/sprite2";
    import { drawIdles } from "$lib/sprites/drawIdles";
    import { updateSprites } from './ui/updateSprites';

    let canvasEl: HTMLCanvasElement; // saved for window reshapes
    let ctx: CanvasRenderingContext2D;
    let animationID: number; // saved for easy cleanup
    let lastTime = performance.now(); // tracks frame time

    let matchID: string;
    $: matchID = $page.params.id!;
    let teamIdx: number;

    let hoverIdx: number = -1;

    let atlasMap: Record<number, Atlas> // modelNo to Atlas object
    let modelAnimations: Record<number, { name: string; anims: string[] }> ; // 0 is bench, 1 is field

    let ws: WebSocket | undefined;
    let stateManager: StateManager = new StateManager();
    
    let currentState: GameState;
    let sprites: SpriteDesc[] = [];


    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvasEl.getBoundingClientRect();
        canvasEl.width  = Math.max(1, Math.round(width  * dpr));
        canvasEl.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function loop(now: number) { // now is current time relative to page load
        const dt = now - lastTime; // ms since last frame
        lastTime = now;

        // interpolate the current state
        currentState = stateManager.Update(currentState, now + performance.timeOrigin);

        // update sprite states
        if(currentState) { updateSprites(sprites, currentState, dt); }

        // draw
        const width = canvasEl.clientWidth;
        const height = canvasEl.clientHeight;
        ctx.clearRect(0, 0, width, height);
        //drawBench(ctx, width, height, 2, hoverIdx);
        //drawIdles(ctx, atlases, benchAnimation, width, height, dt);
        if(currentState) { drawField(atlasMap, modelAnimations, ctx, width, height, currentState, teamIdx); }
        
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

            //const idx = benchHitTest(x, y, canvasEl.clientWidth, canvasEl.clientHeight, benchAnimation.length || 2);
            //hoverIdx = idx;
            //canvasEl.style.cursor = idx >= 0 ? 'pointer' : 'default';
        };

        const onLeave = () => {
            hoverIdx = -1;
            canvasEl.style.cursor = 'default';
        };

        const onClick = (e: MouseEvent) => {
            const r = canvasEl.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;

            //const idx = benchHitTest(x, y, canvasEl.clientWidth, canvasEl.clientHeight, benchAnimation.length || 2);
            //if (idx >= 0 && ws) { sendBenchMove(ws, idx) };
        };

        canvasEl.addEventListener('mousemove', onMove);
        canvasEl.addEventListener('mouseleave', onLeave);
        canvasEl.addEventListener('click', onClick);

        currentState = initGameState();

        let cancelled = false;
        (async () => { 

            // websocket setup, also set up clientIdx
            const result = await connectWS(matchID, stateManager);
            if (result) { ({ ws, teamIdx } = result); }

            // sprite init
            const modelNumbers = [ 0, 1 ];
            const res = await fetch('/sprites.json');
            const SPRITES: Record<number, { name: string; anims: string[] }> = await res.json();
            modelAnimations = modelNumbers.map((id: number) => SPRITES[id]).filter(Boolean);
            atlasMap = await createAtlases2(modelAnimations);

            // guard against requestAnimationFrame
            if (cancelled) return;

            // get the game state
            if(ws) {getFullState(ws);}
            
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