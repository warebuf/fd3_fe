<script lang="ts">

    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { connectWS } from "./networking/ws";
    import { stopPing } from "./networking/ping";

    import { StateManager } from "./engine/stateManager"
    import { initGameState, cloneGameState, type GameState, Phase } from './engine/gameState';
    import { interpolate } from './engine/interpolate';

    import { drawBoard } from './ui/drawBoard';
    import { buildRecurringMap, type CardIDToChainStepIndex } from './engine/buildRecurringMap';
    import { calcCoordinates, calcZoneSetupCoordinates, getClickedCard, mirrorUIWithHand, type coordinate } from './ui/cardCoordinates';

    // drawing related
    let canvasEl: HTMLCanvasElement; // saved for window reshapes
    let ctx: CanvasRenderingContext2D;
    let animationID: number; // saved for easy cleanup

    // misc info
    let matchID: string;
    $: matchID = $page.params.id!;
    let teamIdx: number;

    // networking related
    let ws: WebSocket | undefined;
    let stateManager: StateManager = new StateManager();
    
    // game state related
    let authoritativeState: GameState;
    let interpolatedState: GameState;

    // ui
    let clickedIndex: number = -1; // is unitIdx
    let handOrder: number[][] = [];
    let handCoords: coordinate[][] = [];
    let stagedCoords: coordinate[][] = [];
    let recurringMap = new Map<number, CardIDToChainStepIndex>();


    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvasEl.getBoundingClientRect();
        canvasEl.width  = Math.max(1, Math.round(width  * dpr));
        canvasEl.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // recalculate hand and staged coordinates
        handCoords = calcCoordinates(handOrder, ctx.canvas.clientWidth, teamIdx);
        stagedCoords = calcZoneSetupCoordinates(authoritativeState?.StagedCards ?? [[], []], ctx.canvas.clientWidth, teamIdx);
    }

    function loop(now: number) { // now is current time relative to page load

        // update with any scheduled events
        let significantEvent = false;
        [authoritativeState, significantEvent] = stateManager.Update(authoritativeState, now + performance.timeOrigin);

        // interpolate current state
        if(significantEvent) { interpolatedState = cloneGameState(authoritativeState); }
        interpolate(authoritativeState, interpolatedState, now + performance.timeOrigin);

        // update derived states
        if(significantEvent) {
            handOrder = mirrorUIWithHand(handOrder, interpolatedState.Hand);
            handCoords = calcCoordinates(handOrder, ctx.canvas.clientWidth, teamIdx);
            stagedCoords = calcZoneSetupCoordinates(interpolatedState.StagedCards, ctx.canvas.clientWidth, teamIdx);
            recurringMap = buildRecurringMap(interpolatedState.ReactionPQ.Items);
        }

        // draw
        const width = canvasEl.clientWidth;
        const height = canvasEl.clientHeight;
        ctx.clearRect(0, 0, width, height);
        drawBoard(ctx, interpolatedState, teamIdx, handOrder, handCoords, clickedIndex, recurringMap, stagedCoords);

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

            clickedIndex = getClickedCard(x, y, handCoords, handOrder);
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault(); // prevent page scroll
                if (clickedIndex !== -1) {
                    const msgType = interpolatedState?.Phase === Phase.BoardSetup ? "stageCard" : "hand";
                    ws?.send(JSON.stringify({ type: msgType, CardIndex: clickedIndex }));
                    clickedIndex = -1;
                }
            }
        };

        canvasEl.addEventListener('mousemove', onMove);
        canvasEl.addEventListener('mouseleave', onLeave);
        canvasEl.addEventListener('click', onClick);
        window.addEventListener('keydown', onKeyDown);

        authoritativeState = initGameState();
        interpolatedState = cloneGameState(authoritativeState);

        let cancelledWebsocket = false;
        (async () => { 

            // websocket setup, also set up clientIdx
            const result = await connectWS(matchID, stateManager); // does not stop awaiting until connection is open
            if (result) { ({ ws, teamIdx } = result); }

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

<div class="wrap">
    <canvas bind:this={canvasEl}></canvas>
    {#if interpolatedState?.Phase === Phase.BoardSetup}
        <div class="ready-overlay">
            <button
                class="ready-btn"
                disabled={interpolatedState?.Ready[teamIdx] ?? false}
                on:click={() => ws?.send(JSON.stringify({ type: "ready" }))}
            >
                {interpolatedState?.Ready[teamIdx] ? "Waiting..." : "Ready Up"}
            </button>
        </div>
    {/if}
</div>

<style>
    .wrap {
        flex: 1;
        min-height: 0;
        display: flex;
        position: relative;
    }

    canvas {
        width: 100%;
        height: 100%;
        display: block;
        background: #1a1a1a;
    }

    .ready-overlay {
        position: absolute;
        bottom: 32px;
        left: 50%;
        transform: translateX(-50%);
        pointer-events: none;
    }

    .ready-btn {
        pointer-events: all;
        padding: 10px 28px;
        background: #2C2C2A;
        border: 0.5px solid #6E6D69;
        border-radius: 6px;
        color: #D3D1C7;
        font-size: 13px;
        cursor: pointer;
        letter-spacing: 0.04em;
    }

    .ready-btn:hover:not(:disabled) {
        background: #3a3a38;
        border-color: #D3D1C7;
    }

    .ready-btn:disabled {
        color: #888780;
        cursor: default;
        border-color: #444;
    }
</style>