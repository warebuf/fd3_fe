<script lang="ts">

    import { page } from '$app/stores';
    import { onMount } from 'svelte';
  
    let matchID: string;
  
    $: matchID = $page.params.id!;


  
    onMount(() => {
        

        
    });

</script>

<p>Match ID: {matchID}</p>
  