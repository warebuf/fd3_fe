<script lang="ts">

  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let es: EventSource | null;
  let finding = false;

  //let deckInput = "10,10,10";
  let deckInput = "1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7,8,8,8,9,9,9,10,10,10";
  let startingHandInput = "";
  let structNo = 1;

  function parseCardList(s: string): number[] {
    return s.split(",").map(v => v.trim()).filter(v => v !== "").map(Number);
  }

  export async function findMatch() {

    finding = true;

    const deck = parseCardList(deckInput);
    const startingHand = parseCardList(startingHandInput);

    try {
      // create guest cookie
      const res = await fetch("/backend/getGuestID", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deck,
          startingHand,
          structNo,
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
  <div class="fields">
    <label>
      Deck
      <input type="text" bind:value={deckInput} placeholder="e.g. 1,1,2,2,3,3" disabled={finding} />
    </label>
    <label>
      Starting Hand
      <input type="text" bind:value={startingHandInput} placeholder="e.g. 1,2,3" disabled={finding} />
    </label>
    <label>
      Struct No
      <input type="number" bind:value={structNo} min="1" disabled={finding} />
    </label>
  </div>
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
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 16px;
		height: 100%;
	}

  .fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: white;
    font-size: 13px;
  }

  .fields label {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .fields input {
    background: #111;
    border: 1px solid #444;
    border-radius: 6px;
    color: white;
    padding: 4px 8px;
    font-size: 13px;
    width: 220px;
  }

  .fields input:disabled {
    opacity: 0.5;
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

