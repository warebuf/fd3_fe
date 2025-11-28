<script lang="ts">

    import { onMount } from 'svelte';

    import type { Atlas } from "$lib/sprites/sprites";
    import { createAtlases } from "$lib/sprites/sprites";
    import { drawAllSprites, incrementAtlas, decrementAtlas, incrementDirection, decrementDirection } from "$lib/sprites/drawAllSprites";


    let canvasEl: HTMLCanvasElement; // saved for reshapes
    let ctx: CanvasRenderingContext2D;
    let animationID: number; // saved for easy cleanup
    let lastTime = performance.now(); // tracks frame time

    let atlases: Atlas[];
  
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvasEl.getBoundingClientRect();
        canvasEl.width  = Math.max(1, Math.round(width  * dpr));
        canvasEl.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function loop(now: number) {
        const dt = now - lastTime; // ms since last frame
        lastTime = now;

        const width = canvasEl.clientWidth;
        const height = canvasEl.clientHeight;
        ctx.clearRect(0, 0, width, height);

        drawAllSprites(ctx, atlases, width, height, dt);

        // schedule next frame
        animationID = requestAnimationFrame(loop);
    }

    function onKey(e: KeyboardEvent) {
        switch (e.key) {
        case ',':
            e.preventDefault();
            decrementDirection();
            break;

        case '.':
            e.preventDefault();
            incrementDirection();
            break;

        case 'a':
        case 'A':
        case 'ArrowLeft':
            e.preventDefault();
            decrementAtlas(atlases);
            break;
        
        case 'd':
        case 'D':
        case 'ArrowRight':
            e.preventDefault();
            incrementAtlas(atlases);
            break;

        default:
            break;
        }
    }


    onMount(() => {
            
        // canvas setup
        ctx = canvasEl.getContext("2d")!;
        resizeCanvas();                       
        window.addEventListener("resize", resizeCanvas);

        // keys setup
        window.addEventListener('keydown', onKey);

        let cancelled = false;
        (async () => { 

            // 
            const characters = [ 'bulbasaur', 'missingno', 'caterpie', 'charmander', 'ekans', 'kakuna', 'pidgey', 'pikachu', 'rattata', 'sandshrew', 'sparrow', 'squirtle', 'weedle' ]

            // server call, get list of sheet paths for a character
            // NOTE: instead of a server call, this could just be a JSON
            const spriteActionsRequest = await fetch('/api/sprites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ characters: characters })
            });

            // get list of sprite sheets
            const spriteActionsJSON = await spriteActionsRequest.json();

            // character setup 
            atlases = await createAtlases(spriteActionsJSON);

            // guard against requestAnimationFrame
            if (cancelled) return;

            // start the game loop once everything loads
            animationID = requestAnimationFrame(loop);

        })();

        // cleanup on unmount
        return () => {
            cancelled = true;

            cancelAnimationFrame(animationID); // cancel animation loop
            
            window.removeEventListener("resize", resizeCanvas); // stop listeners
            window.removeEventListener('keydown', onKey); // stop listeners
        };

    });

</script>

<div class="wrap">
    <canvas bind:this={canvasEl}></canvas>
</div>

<style>
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