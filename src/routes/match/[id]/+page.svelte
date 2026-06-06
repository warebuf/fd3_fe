<script lang="ts">

    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import { connectWS } from "./networking/ws";
    import { stopPing, serverClockOffset } from "./networking/ping";

    import { StateManager } from "./engine/stateManager"
    import { initGameState, cloneGameState, type GameState, Phase } from './engine/gameState';
    import { interpolate } from './engine/interpolate';

    import { drawBoard, drawPhaseAnnouncement } from './ui/drawBoard';
    import { downloadLogs } from './engine/debugLog';
    import { calcBoardLayout, getClickedCard, mirrorUIWithHand, type BoardLayout } from './ui/cardCoordinates';
    import { PausePhase } from './engine/gameState';

    // drawing related
    let canvasEl: HTMLCanvasElement; // saved for window reshapes
    let ctx: CanvasRenderingContext2D;
    let animationID: number; // saved for easy cleanup

    // misc info
    let matchID: string;
    $: matchID = $page.params.id!;
    let teamIndex: number;

    // networking related
    let ws: WebSocket | undefined;
    let stateManager: StateManager = new StateManager();
    
    // game state related
    let authoritativeState: GameState;
    let interpolatedState: GameState;

    // ui
    let clickedIndex: number = -1; // is unitIdx
    let handOrder: number[][] = [];
    let layout: BoardLayout = { hand: [[], []], field: [[], []], stack: [] };

    let phaseShown = -1;
    let phaseMessageStart = -Infinity;
    let pauseEnd = 0; // absolute wall time when the current pause expires


    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvasEl.getBoundingClientRect();
        canvasEl.width  = Math.max(1, Math.round(width  * dpr));
        canvasEl.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        layout = calcBoardLayout(ctx.canvas.clientWidth, teamIndex, handOrder, interpolatedState?.Field ?? [[], []], interpolatedState?.Stack?.length ?? 0);
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
            layout = calcBoardLayout(ctx.canvas.clientWidth, teamIndex, handOrder, interpolatedState.Field, interpolatedState.Stack.length);

            if (authoritativeState.Phase !== phaseShown) {
                if (phaseShown !== -1) {
                    phaseMessageStart = now;
                }
                phaseShown = authoritativeState.Phase;
            }
        }

        // draw
        ctx.clearRect(0, 0, canvasEl.clientWidth, canvasEl.clientHeight);
        const currentWallTime = now + performance.timeOrigin + get(serverClockOffset);
        drawBoard(ctx, interpolatedState, currentWallTime, teamIndex, layout, handOrder, clickedIndex);
        drawPhaseAnnouncement(ctx, authoritativeState.Phase, phaseMessageStart, now);

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

            clickedIndex = getClickedCard(x, y, layout, handOrder, interpolatedState?.Field ?? [[], []], interpolatedState?.Stack?.map(c => c.CardID) ?? []);
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault(); // prevent page scroll
                if (clickedIndex !== -1) {
                    const card = interpolatedState?.Cards[clickedIndex];
                    if (interpolatedState?.Phase === Phase.BoardSetup) {
                        if (card?.StageOrder > 0) {
                            ws?.send(JSON.stringify({ type: "unstage", CardIndex: clickedIndex }));
                        } else {
                            ws?.send(JSON.stringify({ type: "stage", CardIndex: clickedIndex }));
                        }
                    } else if (interpolatedState?.Phase === Phase.Play || interpolatedState?.Phase === Phase.Reveal) {
                        if (card?.AutoSummon > 0) {
                            ws?.send(JSON.stringify({ type: "unautosummon", CardIndex: clickedIndex }));
                        } else {
                            ws?.send(JSON.stringify({ type: "autosummon", CardIndex: clickedIndex }));
                        }
                    }
                    clickedIndex = -1;
                }
            } else if (e.key === 'r' || e.key === 'R') {
                if (interpolatedState?.Phase === Phase.BoardSetup) {
                    if (interpolatedState?.Ready[teamIndex]) {
                        ws?.send(JSON.stringify({ type: "unready" }));
                    } else {
                        ws?.send(JSON.stringify({ type: "ready" }));
                    }
                }
            } else if (e.key === 'd' || e.key === 'D') {
                downloadLogs();
            } else if (e.key === 'p' || e.key === 'P') {
                const ps = interpolatedState;
                if (!ps) return;
                const canPause   = ps.TimeBank[teamIndex] > 0 && ps.Phase >= Phase.Draw;
                const canUnpause = ps.PausePhase === PausePhase.FullPause   && ps.TeamPaused === teamIndex;
                if (canPause || canUnpause) {
                    ws?.send(JSON.stringify({ type: "fullPause" }));
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
            if (result) { ({ ws, teamIndex } = result); }

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
                on:click={() => {
                    if (interpolatedState?.Ready[teamIndex]) {
                        ws?.send(JSON.stringify({ type: "unready" }));
                    } else {
                        ws?.send(JSON.stringify({ type: "ready" }));
                    }
                }}
            >
                {#if interpolatedState?.Ready[teamIndex]}
                    <span class="ready-icon">✓</span> Unready (r)
                {:else}
                    <span class="ready-icon">✓</span> Ready (r)
                {/if}
            </button>
        </div>
    {/if}
    {#if interpolatedState}
        {@const canPause   = interpolatedState.TimeBank[teamIndex] > 0 && interpolatedState.Phase >= Phase.Draw}
        {@const canUnpause = interpolatedState.PausePhase === PausePhase.FullPause   && interpolatedState.TeamPaused === teamIndex}
        <div class="controls">
            <button
                class="ctrl-btn"
                class:dimmed={!canPause && !canUnpause}
                disabled={!canPause && !canUnpause}
                on:click={() => {
                    if (canPause || canUnpause) {
                        ws?.send(JSON.stringify({ type: "fullPause" }));
                    }
                }}
            >
                <span class="key">P</span>
                {canUnpause ? 'Unpause' : 'Pause'}
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
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
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

    .controls {
        position: absolute;
        bottom: 10px;
        right: 10px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        pointer-events: none;
    }

    .ctrl-btn {
        pointer-events: all;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: transparent;
        border: none;
        color: #888780;
        font-size: 11px;
        cursor: pointer;
        transition: border-color 0.15s, color 0.15s;
        white-space: nowrap;
    }

    .ctrl-btn:hover:not(:disabled) {
        color: #D3D1C7;
    }

    .ctrl-btn:disabled, .ctrl-btn.dimmed {
        color: #444;
        cursor: default;
    }

    .key {
        font-family: monospace;
        font-size: 10px;
        color: #555;
        background: #2a2a28;
        border: 1px solid #3a3a38;
        border-radius: 2px;
        padding: 1px 4px;
        line-height: 1;
    }

    .ctrl-btn:hover:not(:disabled) .key {
        color: #888;
        border-color: #555;
    }

    .ctrl-btn.dimmed .key {
        color: #333;
        border-color: #2a2a28;
    }
</style>