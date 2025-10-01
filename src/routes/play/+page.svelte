<script lang="ts">
    import { onMount } from "svelte";
  
    let canvasEl: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let dpr: number;
  
    onMount(() => {
        ctx = canvasEl.getContext("2d")!;

        dpr = window.devicePixelRatio || 1;
        const rect = canvasEl.getBoundingClientRect();
        console.log(rect)

        // Set the drawing buffer to (CSS size × DPR)
        canvasEl.width  = Math.round(rect.width  * dpr);
        canvasEl.height = Math.round(rect.height * dpr);

        // Make 1 unit == 1 CSS pixel
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // test square
        ctx.fillStyle = "green";
        ctx.fillRect(100, 100, 1/dpr, 50/dpr);

        ctx.fillStyle = "blue";
        ctx.fillRect(200, 100, 50/dpr, 1/dpr);

        ctx.fillStyle = "red";
        ctx.fillRect(25, 25, 50/dpr, 50/dpr);

    });
  </script>
  
  <style>
    html, body {
      margin: 0;
      height: 100%;
    }
  
    .page {
      display: flex;
      flex-direction: column;      /* topbar on top, main below */
      min-height: 100vh;
    }
  
    .topbar {
      height: 60px;
      background: #333;
      color: white;
      display: flex;
      align-items: center;
      padding: 0 1rem;
    }
  
    .main {
      flex: 1;
      display: flex;            
    }
  
    canvas {
      flex: 1;                     
      display: block;
      background: #111;
    }
  
    .sidebar {
      width: 200px;
      background: #222;
      color: white;
      padding: 1rem;  
    }
  </style>
  
  <div class="page">
    <div class="topbar">Top Bar</div>
    <div class="main">
        <div class="sidebar">Sidebar</div>
        <canvas bind:this={canvasEl}></canvas>
    </div>
  </div>
  