<script lang="ts">

    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import { initDebugDownload, debugDump } from "./debuggers/debug";
    import { connectWS } from "./networking/ws";
    import { stopPing, serverClockOffset } from "./networking/ping";

    import { StateManager } from "./engine/stateManager"
    import { initGameState, cloneGameState, type GameState, Phase, Zone } from './engine/gameState';
    import { interpolate } from './engine/interpolate';

    import { drawBoard, drawPhaseAnnouncement } from './ui/drawBoard';
    import { calcBoardLayout, getClickedCard, getClickedSwitch, mirrorUIWithHand, type coordinate } from './ui/cardCoordinates';
    import { PausePhase, isValidTarget, preselectableAbilities } from './engine/gameState';

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
    let clickedIndex: number = -1;
    let preselecting: number = -1; // card index awaiting a target click (field unit's Active, or hand card's OnPlay)
    let preselectingIndex: number = -1; // which ability slot on that card (Actives or OnPlay, per its zone)
    let handOrder: number[][] = [];
    let positions: coordinate[] = [];
    let stackCoords: coordinate[] = [];

    let phaseShown = -1;
    let phaseMessageStart = -Infinity;
    let pauseEnd = 0; // absolute wall time when the current pause expires


    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvasEl.getBoundingClientRect();
        canvasEl.width  = Math.max(1, Math.round(width  * dpr));
        canvasEl.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const stackItems = (interpolatedState?.ReactionStack ?? []).map(item => ({ cardID: item.CardIndex, isCard: interpolatedState?.Cards[item.CardIndex]?.Zone === Zone.Stack }));
        ({ positions, stackCoords } = calcBoardLayout(ctx.canvas.clientWidth, ctx.canvas.clientHeight, teamIndex, handOrder, interpolatedState?.Field ?? [[], []], stackItems, interpolatedState?.Continuous ?? [[], []]));
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
            const stackItems = interpolatedState.ReactionStack.map(item => ({ cardID: item.CardIndex, isCard: interpolatedState.Cards[item.CardIndex]?.Zone === Zone.Stack }));
            ({ positions, stackCoords } = calcBoardLayout(ctx.canvas.clientWidth, ctx.canvas.clientHeight, teamIndex, handOrder, interpolatedState.Field, stackItems, interpolatedState.Continuous ?? [[], []]));

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
        drawBoard(ctx, interpolatedState, currentWallTime, teamIndex, positions, stackCoords, handOrder, clickedIndex, preselecting);
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

            const fieldCardIDs = [...(interpolatedState?.Field[teamIndex] ?? []), ...(interpolatedState?.Continuous[teamIndex] ?? [])]
                .filter(id => interpolatedState!.Cards[id].MaxCharges > 0 || interpolatedState!.Cards[id].Actives[0].Unlimited);
            const fieldSwitchHit = getClickedSwitch(x, y, positions, fieldCardIDs, 20, 42);
            if (fieldSwitchHit >= 0 && (interpolatedState?.Phase === Phase.Play || interpolatedState?.Phase === Phase.Reveal)) {
                ws?.send(JSON.stringify({ type: "toggleAutoAbility", CardIndex: fieldSwitchHit }));
                return;
            }

            const hit = getClickedCard(x, y, positions, interpolatedState?.ReactionStack ?? [], stackCoords);

            const preselectFlags = preselecting >= 0 ? preselectableAbilities(interpolatedState.Cards[preselecting])[preselectingIndex].TargetFlags : 0;

            if (preselecting >= 0 && hit >= 0 && isValidTarget(interpolatedState.Cards, preselectFlags, preselecting, hit, teamIndex)) {
                ws?.send(JSON.stringify({ type: "preselect", CardIndex: preselecting, TargetCardIndex: hit, AbilityIndex: preselectingIndex }));
                preselecting = -1;
                preselectingIndex = -1;
                clickedIndex = -1;
            } else {
                clickedIndex = hit;
            }
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
                        if (card?.Zone === 5 && card.Team === teamIndex) { // ZoneContinuous
                            ws?.send(JSON.stringify({ type: "active", CardIndex: clickedIndex }));
                        } else if (card?.AutoSummon > 0) {
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
            } else if (e.key === 'a' || e.key === 'A') {

                if (clickedIndex === -1) return;
                if (interpolatedState?.Phase !== Phase.Play && interpolatedState?.Phase !== Phase.Reveal) return;

                const card = interpolatedState.Cards[clickedIndex];
                if (card?.Team !== teamIndex) return;

                if (card.Zone === Zone.Hand) {
                    ws?.send(JSON.stringify({ type: card.AutoSummon > 0 ? "unautosummon" : "autosummon", CardIndex: clickedIndex }));
                } else if (card.Zone === Zone.Field || card.Zone === Zone.Continuous) {
                    ws?.send(JSON.stringify({ type: "toggleAutoAbility", CardIndex: clickedIndex }));
                } else {
                    return;
                }
                clickedIndex = -1;

            } else if (e.key === 'i' || e.key === 'I') {
                
                if (clickedIndex === -1) return;
                if (interpolatedState?.Phase !== Phase.Play && interpolatedState?.Phase !== Phase.Reveal) return;
                
                const card = interpolatedState.Cards[clickedIndex];
                if (card?.Zone !== 1 || card.Team !== teamIndex) return; // ZoneHand
                
                ws?.send(JSON.stringify({ type: "instant", CardIndex: clickedIndex }));
                clickedIndex = -1;

            } else if (e.key === 't' || e.key === 'T') {

                if (clickedIndex === -1) return;
                const card = interpolatedState?.Cards[clickedIndex];
                if (card?.Team !== teamIndex) return;
                if (card.Zone !== Zone.Field && card.Zone !== Zone.Hand) return;

                const abilities = preselectableAbilities(card);
                const startAt = preselecting === clickedIndex ? preselectingIndex + 1 : 0;
                let nextIndex = -1;
                for (let step = 0; step < abilities.length; step++) {
                    const i = (startAt + step) % abilities.length;
                    if (abilities[i].TargetFlags !== 0) { nextIndex = i; break; }
                }
                if (nextIndex === -1) return;

                preselecting = clickedIndex;
                preselectingIndex = nextIndex;
                clickedIndex = -1;

            } else if (e.key === 'u' || e.key === 'U') {

                if (clickedIndex === -1) return;
                if (interpolatedState?.Phase !== Phase.Play) return;

                const card = interpolatedState.Cards[clickedIndex];
                if (card?.Zone !== 2 || card.Team !== teamIndex) return; // ZoneField
                // TODO: hardcoded duplicate of the backend's charge-gating rule (handleUnitAbility in InputHandlerAbility.go) for responsive UI; keep in sync
                if (!card.Actives[0].Unlimited && card.Charges <= 0) return;

                ws?.send(JSON.stringify({ type: "unitAbility", CardIndex: clickedIndex }));
                clickedIndex = -1;

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
        const cleanupDebug = initDebugDownload();

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
            cleanupDebug();
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
        {@const spaceLabel = interpolatedState.Phase === Phase.BoardSetup ? 'Stage' : 'Instant Play, if not Auto Play'}
        <div class="controls">
            <button class="ctrl-btn dimmed" disabled>
                <span class="key">I</span>
                Instant Play
            </button>
            <button class="ctrl-btn dimmed" disabled>
                <span class="key">A</span>
                Auto Play
            </button>
            <button
                class="ctrl-btn"
                class:dimmed={interpolatedState.Phase !== Phase.BoardSetup}
                disabled={interpolatedState.Phase !== Phase.BoardSetup}
            >
                <span class="key">Space</span>
                {spaceLabel}
            </button>
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
        top: 45%;
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
        gap: 1px;
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