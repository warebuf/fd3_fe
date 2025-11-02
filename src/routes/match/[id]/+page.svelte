<script lang="ts">

    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { connectWS } from "./networking/ws";
  
    let matchID: string;
    $: matchID = $page.params.id!;

    let ws: WebSocket;
  
    onMount(() => {
        
        (async () => { 
    
            // websocket setup
            ws = connectWS();

        })();


    });

</script>

  