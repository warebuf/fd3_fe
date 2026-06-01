<script lang="ts">

  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let es: EventSource | null;
  let finding = false;

  export async function findMatch() {
    
    finding = true;

    try {
      // create guest cookie
      const res = await fetch("/backend/getGuestID", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deck: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6],
          startingHand: [],
          structNo: 1,
        }),
      });
      if (!res.ok) {
        throw new Error("failed to get guestID");
      }

      es = new EventSource("/backend/matchmakingSSE", { withCredentials: true });
      es.onmessage = (e) => {
        if (e.data === "ping") { // ignore
          return;
        }
        if (e.data.startsWith("match")) {

          const matchID = e.data.slice(6); // remove "match "

          es?.close();
          es = null;
          finding = false;

          goto(`/match/${matchID}`);

        } else {
          console.log("msg:", e.data);
        }
      };

      es.onerror = (e) => {
        if ( es && es.readyState === EventSource.CLOSED ) {
        } else {
          console.log("error", e)
        }
        es?.close()
        es = null;
        finding = false;
      }

    } catch (e) {
      console.log("error", e)
      finding = false;
    }
    
  }

  export async function toggleFindMatch() {
    if(finding) {
      es?.close();
      es = null;
      finding = false;
      return;
    }
    await findMatch();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.code === "Space") {
      e.preventDefault(); // prevent default page scroll
      toggleFindMatch();
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  });

</script>

<div class="center">
  <button
    class="rainbow"
    data-label={finding ? "Searching" : "Find Match"}
    on:click={toggleFindMatch}
    aria-pressed={finding}
    aria-label={finding ? "Cancel matchmaking" : "Find match"}
  > </button>
</div>

<style>

	.center {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%; /* inherits available height from parent */
	}

  .rainbow {
    background-color: transparent;
    width: 90px;
    height: 30px;
    border-radius: 12px;
    border-width: 0;
    z-index: 1;
    position: relative;
    overflow: hidden;
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    /* gradient */
    --gradient: conic-gradient(
      #FF2E2E,
      #FF831E,
      #FCFF51,
      #58FF57,
      #575FFF,
      #D257FF,
      #FF57E5,
      #FF1556
    )
  }

  .rainbow::before {
    content: '';
    position: absolute;
    width: 110%;
    height: 350%;
    background: var(--gradient);
    z-index: 2;

    animation: spin 1.5s infinite linear;
  }

  .rainbow::after {
    content: attr(data-label);

    /* center text */
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

    /* center cover */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 3;
    background-color: black;
    
    width: 98%;
    height: 94%;
    border-radius: 12px;
    border-width: 0;
  }

  .rainbow[data-label="Find Match"]::before {
    animation-play-state: paused;
  }

  .rainbow:hover::before{
    animation: spin 1.5s infinite linear;
  }

  @keyframes spin {
    to{
      transform: rotate(360deg);
    }
  }

</style>

