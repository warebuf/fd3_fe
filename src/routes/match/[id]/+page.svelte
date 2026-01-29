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
    import { initDrawMenuSprites, drawTargets, drawTargetButton, onTargetButton, drawTargetSelectText, resetSelected, setSelected, getSelectedUnitIdx, getSelectedFuncIdx, getSelectedButtonType, setPendingTargets, getPendingTargets, drawPendingTargets, getAutoFuncIdx } from './ui/indiv/drawSelectedButtons';
    import type { Coordinate } from './ui/misc/Coordinates';

    import type { Atlas, SpriteDesc } from "$lib/sprites/sprite2";
    import { createAtlases2 } from "$lib/sprites/sprite2";
    import { updateSprites } from './ui/updateSprites';
    import { calcPlayerBench } from './ui/updateUIData/calcPlayerBench';
    import { drawStats } from './ui/zones/drawStats';
    import { drawStructures } from './ui/zones/drawStructures';
    import { getStructureBitmap } from './ui/getBitmap/getStructureBitmap';

    
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
    let structBitmap: ImageBitmap;
    let modelData: any;

    // ui stuff
    let uiState = 0;
    let unitPositions: Record<number,Coordinate> = {};

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
            unitPositions = {};
        }

        // draw
        const width = canvasEl.clientWidth;
        const height = canvasEl.clientHeight;
        ctx.clearRect(0, 0, width, height);
        if(interpolatedState) { 
            drawStats(ctx, width, height, interpolatedState, hoverIdx, modelData);
            drawBench(ctx, width, height, interpolatedState, teamIdx, hoverIdx, atlasMap, sprites, unitPositions, significantEvent);
            drawField(ctx, width, height, interpolatedState, teamIdx, atlasMap, sprites, unitPositions, significantEvent); 
            drawStructures(ctx, width, height, interpolatedState, teamIdx, structBitmap, dt);
        }
        drawNextRoundCount(ctx, width, height, nextRoundTime);

        if(uiState == 2) {
            drawTargetSelectText(ctx);
            drawPendingTargets(ctx, unitPositions);
        } else if(uiState === 1) {
            drawTargets(ctx, interpolatedState, unitPositions, -1, uiState);
            drawTargetButton(ctx);
        } else {
            drawTargets(ctx, interpolatedState, unitPositions, hoverIdx, uiState);
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
            if(idx < 0) { 
                [idx] = fieldHitTest(x,y,canvasEl.clientWidth, canvasEl.clientHeight, teamIdx, interpolatedState); 
            }
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

            const [fieldIdx, midx, midy] = fieldHitTest(x,y,canvasEl.clientWidth, canvasEl.clientHeight, teamIdx, interpolatedState);

            let checkUIState0 = true;
            if(uiState === 2) {

                checkUIState0 = false;

                let reset = true;
                if(fieldIdx >= 0) {
                    const finished = setPendingTargets(fieldIdx, interpolatedState.Team[fieldIdx]===teamIdx); // add to target list
                    if(finished && ws) { // if complete, send to server
                        const uid = getSelectedUnitIdx();
                        const fid = getSelectedFuncIdx(interpolatedState);
                        const arr = getPendingTargets();
                        const t1 = (arr.length > 0) ? arr[0] : -1;
                        const t2 = (arr.length > 1) ? arr[1] : -1;
                        ws.send(JSON.stringify( { Type: "Target", UnitID: uid, FunctionID: fid, Target1: t1, Target2: t2 } ));
                    } else {
                        reset = false;
                    }
                }

                if(reset) {
                    resetSelected();
                    uiState = 0;
                }
                
            } else if(uiState === 1) {
                if( onTargetButton(x,y) ) { // clicked aim/sword

                    const buttonType = getSelectedButtonType();
                    if( buttonType === "" ) {

                    } else if( buttonType === "Manual" ) { // sword
                        const fidx = getAutoFuncIdx(interpolatedState);
                        if(ws && fidx >= 0) { 
                            ws.send(JSON.stringify( { Type: "Active", UnitID: getSelectedUnitIdx(), FunctionID: fidx }))
                        }
                        resetSelected();
                        uiState = 0;
                        checkUIState0 = false;
                    } else { // aim
                        uiState = 2;
                        checkUIState0 = false;
                    }

                } else if (fieldIdx === getSelectedUnitIdx() && ws) { // clicked card
                    const fidx = getAutoFuncIdx(interpolatedState);
                    if(ws && fidx >= 0) { 
                        ws.send(JSON.stringify( { Type: "Active", UnitID: getSelectedUnitIdx(), FunctionID: fidx }))
                    }
                    checkUIState0 = false;
                    resetSelected();
                    uiState = 0;
                } else { // clicked elsewhere
                    resetSelected();
                    uiState = 0;
                }
            }

            if(checkUIState0) {
                const benchIdx = benchHitTest(canvasEl.clientHeight, x, y, canvasEl.clientWidth, canvasEl.clientHeight, playerBench);
                if(fieldIdx >= 0 && interpolatedState.ModelNo[fieldIdx] === 4) {
                    setSelected(modelData, interpolatedState, fieldIdx, midx, midy);
                    uiState = 1;
                }
                else if (benchIdx >= 0 && ws) { sendBenchMove(ws, benchIdx); }
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

            //
            structBitmap = await getStructureBitmap();

            const modelDataResponse = await fetch("/backend/getModelData");
            modelData = await modelDataResponse.json();

            await initDrawMenuSprites();

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