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

    import { drawBoard, drawPhaseAnnouncement, drawStructureDrawButton, drawStructureAutoToggle, drawReadyButton, drawPauseButton } from './ui/drawBoard';
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
    let chainCoords: coordinate[] = [];
    let drawButtonRect: { x: number; y: number; w: number; h: number } | null = null;
    let autoToggleRect: { x: number; y: number; w: number; h: number } | null = null;
    let readyButtonRect: { x: number; y: number; w: number; h: number } | null = null;
    let pauseButtonRect: { x: number; y: number; w: number; h: number } | null = null;

    let phaseShown = -1;
    let phaseMessageStart = -Infinity;
    let pauseEnd = 0; // absolute wall time when the current pause expires


    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvasEl.getBoundingClientRect();
        canvasEl.width  = Math.max(1, Math.round(width  * dpr));
        canvasEl.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const chainItems = (interpolatedState?.Chain ?? []).map(item => ({ cardID: item.CardIndex, isCard: interpolatedState?.Cards[item.CardIndex]?.Zone === Zone.Pending }));
        ({ positions, chainCoords } = calcBoardLayout(ctx.canvas.clientWidth, ctx.canvas.clientHeight, teamIndex, handOrder, interpolatedState?.Field ?? [[], []], chainItems, interpolatedState?.Continuous ?? [[], []], interpolatedState?.Traps ?? [[], []]));
    }

    function sendInstant(cardIndex: number) {
        if (!interpolatedState) return;
        ws?.send(JSON.stringify({ type: "instant", CardIndex: cardIndex }));
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
            const chainItems = interpolatedState.Chain.map(item => ({ cardID: item.CardIndex, isCard: interpolatedState.Cards[item.CardIndex]?.Zone === Zone.Pending }));
            ({ positions, chainCoords } = calcBoardLayout(ctx.canvas.clientWidth, ctx.canvas.clientHeight, teamIndex, handOrder, interpolatedState.Field, chainItems, interpolatedState.Continuous ?? [[], []], interpolatedState.Traps ?? [[], []]));

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
        drawBoard(ctx, interpolatedState, currentWallTime, teamIndex, positions, chainCoords, handOrder, clickedIndex, preselecting);
        drawButtonRect = drawStructureDrawButton(ctx, interpolatedState, teamIndex);
        autoToggleRect = drawStructureAutoToggle(ctx, interpolatedState, teamIndex);
        readyButtonRect = drawReadyButton(ctx, interpolatedState, teamIndex);
        pauseButtonRect = drawPauseButton(ctx, interpolatedState, teamIndex);
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

            if (drawButtonRect && x >= drawButtonRect.x && x <= drawButtonRect.x + drawButtonRect.w
                && y >= drawButtonRect.y && y <= drawButtonRect.y + drawButtonRect.h) {
                ws?.send(JSON.stringify({ type: "structureDraw" }));
                return;
            }

            if (autoToggleRect && x >= autoToggleRect.x && x <= autoToggleRect.x + autoToggleRect.w
                && y >= autoToggleRect.y && y <= autoToggleRect.y + autoToggleRect.h) {
                ws?.send(JSON.stringify({ type: "toggleStructureAutoAbility" }));
                return;
            }

            if (readyButtonRect && x >= readyButtonRect.x && x <= readyButtonRect.x + readyButtonRect.w
                && y >= readyButtonRect.y && y <= readyButtonRect.y + readyButtonRect.h) {
                ws?.send(JSON.stringify({ type: interpolatedState?.Ready[teamIndex] ? "unready" : "ready" }));
                return;
            }

            if (pauseButtonRect && x >= pauseButtonRect.x && x <= pauseButtonRect.x + pauseButtonRect.w
                && y >= pauseButtonRect.y && y <= pauseButtonRect.y + pauseButtonRect.h) {
                ws?.send(JSON.stringify({ type: "fullPause" }));
                return;
            }

            const fieldCardIDs = [...(interpolatedState?.Field[teamIndex] ?? []), ...(interpolatedState?.Continuous[teamIndex] ?? [])]
                .filter(id => interpolatedState!.Cards[id].Actives[0]?.CanAutoFire);
            const fieldSwitchHit = getClickedSwitch(x, y, positions, fieldCardIDs);
            if (fieldSwitchHit >= 0 && interpolatedState?.Phase === Phase.Play) {
                ws?.send(JSON.stringify({ type: "toggleAutoAbility", CardIndex: fieldSwitchHit }));
                return;
            }

            const hit = getClickedCard(x, y, positions, interpolatedState?.Chain ?? [], chainCoords);

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
                    const isPlay = interpolatedState?.Phase === Phase.Play;
                    const isStaging = isPlay || interpolatedState?.Phase === Phase.Draw;
                    if (isPlay && card?.Zone === Zone.Continuous && card.Team === teamIndex) {
                        ws?.send(JSON.stringify({ type: "active", CardIndex: clickedIndex }));
                    } else if (isStaging) {
                        if (card?.AutoSummon > 0) {
                            ws?.send(JSON.stringify({ type: "unautosummon", CardIndex: clickedIndex }));
                        } else {
                            ws?.send(JSON.stringify({ type: "autosummon", CardIndex: clickedIndex }));
                        }
                    }
                    clickedIndex = -1;
                }
            } else if (e.key === 'a' || e.key === 'A') {

                if (clickedIndex === -1) return;
                if (!interpolatedState) return;
                if (interpolatedState.Phase !== Phase.Play && interpolatedState.Phase !== Phase.Draw) return;

                const card = interpolatedState.Cards[clickedIndex];
                if (card?.Team !== teamIndex) return;

                const isPlay = interpolatedState.Phase === Phase.Play;

                if (card.Zone === Zone.Hand) {
                    ws?.send(JSON.stringify({ type: card.AutoSummon > 0 ? "unautosummon" : "autosummon", CardIndex: clickedIndex }));
                } else if (isPlay && (card.Zone === Zone.Field || card.Zone === Zone.Continuous) && card.Actives[0]?.CanAutoFire) {
                    ws?.send(JSON.stringify({ type: "toggleAutoAbility", CardIndex: clickedIndex }));
                } else {
                    return;
                }
                clickedIndex = -1;

            } else if (e.key === 'i' || e.key === 'I') {
                
                if (clickedIndex === -1) return;
                if (interpolatedState?.Phase !== Phase.Play) return;

                const card = interpolatedState.Cards[clickedIndex];
                if (card?.Zone !== 1 || card.Team !== teamIndex) return; // ZoneHand

                sendInstant(clickedIndex);
                clickedIndex = -1;

            } else if (e.key === 't' || e.key === 'T') {

                if (clickedIndex === -1) return;
                const card = interpolatedState?.Cards[clickedIndex];
                if (card?.Team !== teamIndex) return;
                if (card.Zone !== Zone.Field && card.Zone !== Zone.Hand && card.Zone !== Zone.Trap) return;

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
                if (card?.Team !== teamIndex) return;

                if (card.Zone === Zone.Trap) {
                    if (!card.Ready) return; // still setting
                    ws?.send(JSON.stringify({ type: "trapAbility", CardIndex: clickedIndex, AbilityIndex: 0 })); // default 0, hardcoded
                    clickedIndex = -1;
                    return;
                }

                if (card.Zone !== Zone.Field) return;
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
            } else if (e.key === 'd' || e.key === 'D') {
                if (interpolatedState?.Phase !== Phase.Play) return;
                if ((interpolatedState?.Mana[teamIndex] ?? 0) < 100) return;
                ws?.send(JSON.stringify({ type: "structureDraw" }));
            } else if (e.key === 'r' || e.key === 'R') {
                if (interpolatedState?.Phase !== Phase.Draw) return;
                ws?.send(JSON.stringify({ type: interpolatedState?.Ready[teamIndex] ? "unready" : "ready" }));
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
    {#if interpolatedState}
        {@const canPause   = interpolatedState.TimeBank[teamIndex] > 0 && interpolatedState.Phase >= Phase.Draw}
        {@const canUnpause = interpolatedState.PausePhase === PausePhase.FullPause   && interpolatedState.TeamPaused === teamIndex}
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
                class:dimmed={interpolatedState.Phase !== Phase.Play}
                disabled={interpolatedState.Phase !== Phase.Play}
            >
                <span class="key">Space</span>
                Instant Play, if not Auto Play
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