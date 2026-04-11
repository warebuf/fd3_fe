<script lang="ts">

    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { connectWS } from "./networking/ws";
    import { ping, stopPing } from "./networking/ping";

    import { StateManager } from "./engine/stateManager"
    import { initGameState, cloneGameState, type GameState } from './engine/gameState';
    import { interpolate } from './engine/interpolate';

    import { drawBoard } from './ui/drawBoard';


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

        // update derived states
        if(significantEvent) {
        }

        // draw
        const width = canvasEl.clientWidth;
        const height = canvasEl.clientHeight;
        ctx.clearRect(0, 0, width, height);
        drawBoard(ctx, interpolatedState, teamIdx);
        
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
        };

        const onLeave = () => {
            canvasEl.style.cursor = 'default';
        };

        const onClick = (e: MouseEvent) => {
            const r = canvasEl.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;

        };

        canvasEl.addEventListener('mousemove', onMove);
        canvasEl.addEventListener('mouseleave', onLeave);
        canvasEl.addEventListener('click', onClick);

        authoritativeState = initGameState();
        interpolatedState = cloneGameState(authoritativeState);

        let cancelledWebsocket = false;
        (async () => { 

            // websocket setup, also set up clientIdx
            const result = await connectWS(matchID, stateManager); // does not stop awaiting until connection is open
            if (result) { ({ ws, teamIdx, nextRoundTime } = result); }

            // user navigated away, do not continue
            if (cancelledWebsocket) return;

            // get the game state
            if (!ws) return;
            ws.send(JSON.stringify({ type: "fullState" }));

            // start the game loop once everything loads
            animationID = requestAnimationFrame(loop);

        })();

        // cleanup on unmount
        return () => {
            cancelledWebsocket = true;

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