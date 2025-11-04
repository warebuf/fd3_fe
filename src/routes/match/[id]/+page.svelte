<script lang="ts">

    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { connectWS } from "./networking/ws";
    import { ping } from "./networking/pingStore";
  
    let matchID: string;
    $: matchID = $page.params.id!;

    let ws: WebSocket | undefined;
  
    onMount(() => {
        
        (async () => { 

            // websocket setup
            ws = await connectWS(matchID);

        })();

    });

</script>

<div class="ping" aria-live="polite">{$ping} ms</div>

<style>
    .ping {
      position: fixed;
      top: 20px;
      right: 12px;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(0,0,0,0.7);
      color: #fff;
      font: 600 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      backdrop-filter: blur(6px);
      pointer-events: none; /* don't block clicks underneath */
    }
  </style>