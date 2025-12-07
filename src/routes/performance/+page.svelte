<script lang="ts">

    import { onMount } from 'svelte';

    import { initGameState, type GameState } from '../match/[id]/engine/gameState';

    import type { Atlas } from "$lib/sprites/sprite2";
    import { createAtlases2 } from "$lib/sprites/sprite2";

    import { drawToolbox, toolboxHitTest } from './draw/drawToolbox';
    import { addFromToolbox } from './modifyGameState/addFromToolbox';
    import { drawState } from './draw/drawState';

    let canvasEl: HTMLCanvasElement; // saved for window reshapes
    let ctx: CanvasRenderingContext2D;
    
    let state: GameState;

    let atlasMap: Record<number, Atlas>; // modelNo to Atlas object
    let modelData: any;

    let selectedTeam = 0; // default
    let selectedZone = 1;

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvasEl.getBoundingClientRect();
        canvasEl.width  = Math.max(1, Math.round(width  * dpr) );
        canvasEl.height = Math.max(1, Math.round(height * dpr) ); 
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
        ctx.clearRect(0, 0, canvasEl.clientWidth, canvasEl.clientHeight);
        drawToolbox(ctx, canvasEl.clientWidth, canvasEl.clientHeight, atlasMap);
        drawState(ctx, atlasMap, state); 
    }

    onMount(() => {
            
        // canvas setup
        ctx = canvasEl.getContext("2d")!;
        resizeCanvas();                       
        window.addEventListener("resize", resizeCanvas);

        const onClick = (e: MouseEvent) => {
            const r = canvasEl.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;
            const idx = toolboxHitTest( x, y, canvasEl.clientWidth, canvasEl.clientHeight);
            if(idx >= 0) { 
                addFromToolbox(state, modelData, idx, selectedTeam, selectedZone); 
                draw();
            }
        };

        const onKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === 'b') {
                selectZone(0); // Bench
            } else if (key === 'f') {
                selectZone(1); // Field
            } else if (key === '1') {
                selectTeam(0); // Team 0
            } else if (key === '2') {
                selectTeam(1); // Team 1
            }
        };

        window.addEventListener('keydown', onKeyDown);

        canvasEl.addEventListener('click', onClick);

        state = initGameState();

        (async () => { 

            // sprite init
            const modelNumbers = [ 0, 1, 2 ];
            const res = await fetch('/sprites.json');
            const SPRITES: Record<number, { name: string; anims: string[] }> = await res.json();
            const modelAnimations = modelNumbers.map((id: number) => SPRITES[id]).filter(Boolean);
            atlasMap = await createAtlases2(modelAnimations);

            const modelDataResponse = await fetch("/backend/getModelData");
            modelData = await modelDataResponse.json();

            draw();

        })();


        // cleanup on unmount
        return () => {            
            // stop listeners
            window.removeEventListener("resize", resizeCanvas); 
            canvasEl.removeEventListener('click', onClick);
        };

    });

    function selectTeam(id: number) {
        selectedTeam = id;
    }

    function selectZone(id: number) {
        selectedZone = id;
    }

    async function simStep() {
        let copyState : any = { ...state }; // shallow copy this object
        copyState.Timestamp = new Date(copyState.Timestamp).toISOString();
        const resp = await fetch("/backend/simStep", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(copyState),
        });
        const respJSON = await resp.json();
        console.log(respJSON);
        state = respJSON;
        draw();
    }

    async function simMatch() {
        let copyState : any = { ...state }; // shallow copy this object
        copyState.Timestamp = new Date(copyState.Timestamp).toISOString();
        const resp = await fetch("/backend/simMatch", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(copyState),
        });
    }

    async function simProb() {
        let copyState : any = { ...state }; // shallow copy this object
        copyState.Timestamp = new Date(copyState.Timestamp).toISOString();
        const resp = await fetch("/backend/simProb", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(copyState),
        });
    }

</script>

<div class="wrap">
    <canvas bind:this={canvasEl}></canvas>
</div>

<div class="team-toggle">
    <button class:selected={selectedTeam === 0} on:click={() => selectTeam(0)}>
      Team 0
    </button>
  
    <button class:selected={selectedTeam === 1} on:click={() => selectTeam(1)}>
      Team 1
    </button>
</div>
<div class="zone-toggle">
    <button class:selected={selectedZone === 0} on:click={() => selectZone(0)}>
      Bench
    </button>
  
    <button class:selected={selectedZone === 1} on:click={() => selectZone(1)}>
      Field
    </button>
</div>

<button on:click={() => simStep()}>
    Simulate Step
</button>
<button on:click={() => simMatch()}>
    Simulate Match
</button>
<button on:click={() => simProb()}>
    Simulate Probabilities
</button>
<style>

    button.selected {
        background: #555;
    }
    
    .wrap {
        flex: 1;
        min-height: 0;
        display: flex;

        height: 70vh;
    }

    canvas {
        width: 100%;
        height: 100%;
        display: block;
        background: #0D0D0D;
    }
</style>