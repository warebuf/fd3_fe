<script lang="ts">

    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { connectWS } from "./networking/ws";
    import { ping, stopPing } from "./networking/ping";

    import { sendBenchMove } from "./networking/eventTypes";
    import { getFullState } from "./networking/getState";
    import { StateManager } from "./engine/stateManager"
    import { initGameState, cloneGameState, type GameState } from './engine/gameState';
    import { interpolate } from './engine/interpolate';

    import { drawNextRoundCount} from "./ui/zones/drawNextRoundCount"
    import { drawBench, benchHitTest } from "./ui/zones/drawBench"
    import { drawField, fieldHitTest } from "./ui/zones/drawField"

    import type { Atlas, SpriteDesc } from "$lib/sprites/sprite2";
    import { createAtlases2, createBitmap } from "$lib/sprites/sprite2";
    import { updateSprites } from './ui/updateSprites';
    import { calcPlayerBench } from './ui/updateUIData/calcPlayerBench';
    import { drawStats } from './ui/zones/drawStats';
    import { drawTarget, drawTargetButton } from './ui/indiv/drawMenu';

    let canvasEl: HTMLCanvasElement; // saved for window reshapes
    let ctx: CanvasRenderingContext2D;
    let animationID: number; // saved for easy cleanup
    let lastTime = performance.now(); // tracks frame time

    let matchID: string;
    $: matchID = $page.params.id!;
    let teamIdx: number;

    let hoverIdx: number = -1; // is unitIdx

    let ws: WebSocket | undefined;
    let stateManager: StateManager = new StateManager();
    let nextRoundTime : Date;
    
    let authoritativeState: GameState;
    let interpolatedState: GameState;

    // derived states
    let playerBench : number[] = [];

    let atlasMap: Record<number, Atlas>; // modelNo to Atlas object
    let sprites: SpriteDesc[] = [];
    let modelData: any;

    let targetSprite : ImageBitmap;
    let targetIconSprite : ImageBitmap;
    let selectedUnit : number = -1;

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

        // update with any scheduled events
        let significantEvent = false;
        [authoritativeState, significantEvent] = stateManager.Update(authoritativeState, now + performance.timeOrigin);

        // interpolate current state
        if(significantEvent) { interpolatedState = cloneGameState(authoritativeState); }
        interpolate(authoritativeState, interpolatedState, now + performance.timeOrigin);

        // update sprite states
        if(interpolatedState) { 
            updateSprites(atlasMap, sprites, interpolatedState, dt); 
        }

        // update derived states
        if(significantEvent) {
            playerBench = calcPlayerBench(interpolatedState, teamIdx);
        }

        // draw
        const width = canvasEl.clientWidth;
        const height = canvasEl.clientHeight;
        ctx.clearRect(0, 0, width, height);
        if(interpolatedState) { 
            drawStats(ctx, width, height, interpolatedState, hoverIdx, modelData);
            drawBench(ctx, width, height, interpolatedState, teamIdx, hoverIdx, atlasMap, sprites);
            drawField(ctx, width, height, interpolatedState, teamIdx, atlasMap, sprites); 
        }
        drawNextRoundCount(ctx, width, height, nextRoundTime);
        if(selectedUnit >= 0) {
            drawTarget(ctx,425,514, targetSprite)
            drawTargetButton(ctx,100,100, targetIconSprite);
        }

        
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

            let idx = benchHitTest(canvasEl.clientHeight, x, y, canvasEl.clientWidth, canvasEl.clientHeight, playerBench);
            if(idx < 0) { idx = fieldHitTest(x,y,canvasEl.clientWidth, canvasEl.clientHeight, teamIdx, interpolatedState); }
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

            let idx = benchHitTest(canvasEl.clientHeight, x, y, canvasEl.clientWidth, canvasEl.clientHeight, playerBench);
            if (idx >= 0 && ws) { sendBenchMove(ws, idx) }
            else {
                idx = fieldHitTest(x,y,canvasEl.clientWidth, canvasEl.clientHeight, teamIdx, interpolatedState);
                if(idx >= 0 && interpolatedState.ModelNo[idx] === 4) {
                    selectedUnit = idx;
                }
            }

        };

        canvasEl.addEventListener('mousemove', onMove);
        canvasEl.addEventListener('mouseleave', onLeave);
        canvasEl.addEventListener('click', onClick);

        authoritativeState = initGameState();
        interpolatedState = cloneGameState(authoritativeState);

        let cancelled = false;
        (async () => { 

            // websocket setup, also set up clientIdx
            const result = await connectWS(matchID, stateManager);
            if (result) { ({ ws, teamIdx, nextRoundTime } = result); }

            // sprite init
            const modelNumbers = [ 0,1,2,3,4 ];
            const res = await fetch('/sprites.json');
            const SPRITES: Record<number, { name: string; anims: string[] }> = await res.json();
            const modelAnimations = modelNumbers.map((id: number) => SPRITES[id]).filter(Boolean);
            atlasMap = await createAtlases2(modelAnimations);

            const modelDataResponse = await fetch("/backend/getModelData");
            modelData = await modelDataResponse.json();

            targetSprite = await createBitmap("target");
            targetIconSprite = await createBitmap("targetIcon");

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