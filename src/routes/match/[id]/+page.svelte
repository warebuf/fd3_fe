<script lang="ts">

    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { connectWS } from "./networking/ws";
    import { stopPing } from "./networking/ping";

    import { StateManager } from "./engine/stateManager"
    import { initGameState, cloneGameState, type GameState, type SimulationItem, Phase } from './engine/gameState';
    import { interpolate } from './engine/interpolate';

    import { drawBoard } from './ui/drawBoard';
    import { buildRecurringMap } from './engine/buildRecurringMap';
    import { calcCoordinates, getClickedCard, mirrorUIWithHand, type coordinate } from './ui/cardCoordinates';

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
    let recurringMap = new Map<number, SimulationItem>();


    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvasEl.getBoundingClientRect();
        canvasEl.width  = Math.max(1, Math.round(width  * dpr));
        canvasEl.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        handCoords = calcCoordinates(handOrder, ctx.canvas.clientWidth, teamIdx);
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
            recurringMap = buildRecurringMap(interpolatedState.SimulationPQ.Items);
        }

        // draw
        const width = canvasEl.clientWidth;
        const height = canvasEl.clientHeight;
        ctx.clearRect(0, 0, width, height);
        drawBoard(ctx, interpolatedState, teamIdx, handOrder, handCoords, clickedIndex, recurringMap);

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
                    const card = interpolatedState?.Cards[clickedIndex];
                    if (interpolatedState?.Phase === Phase.BoardSetup && card?.AutoSummon > 0) {
                        ws?.send(JSON.stringify({ type: "clearAutoSummon", CardIndex: clickedIndex }));
                    } else {
                        ws?.send(JSON.stringify({ type: "hand", CardIndex: clickedIndex }));
                    }
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
            window.removeEventListener('keydown', onKeyDown);
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
                {#if interpolatedState?.Ready[teamIdx]}
                    <span class="ready-icon">✓</span> Waiting...
                {:else}
                    <span class="ready-icon">✓</span> Ready Up
                {/if}
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
        bottom: 125px;
        left: 50%;
        transform: translateX(-50%);
        pointer-events: none;
    }

    .ready-btn {
        pointer-events: all;
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 5px 12px;
        background: #1e1e1c;
        border: 1px solid #444442;
        border-radius: 4px;
        color: #aaa;
        font-size: 11px;
        cursor: pointer;
        transition: border-color 0.15s, color 0.15s;
        white-space: nowrap;
    }

    .ready-icon {
        color: #6abf6a;
        font-size: 11px;
    }

    .ready-btn:hover:not(:disabled) {
        border-color: #777;
        color: #D3D1C7;
    }

    .ready-btn:disabled {
        color: #444;
        cursor: default;
        border-color: #2a2a28;
    }

    .ready-btn:disabled .ready-icon {
        color: #333;
    }
</style>