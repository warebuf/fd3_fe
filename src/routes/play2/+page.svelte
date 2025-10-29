


<script lang="ts">

  let es: EventSource;

  export async function findMatch() {
    console.log("called findMatch");

    // create guest cookie
    const res = await fetch("/backend/getGuestID", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok && res.status !== 204) {
      throw new Error("failed to get guestID");
    }

    es = new EventSource("/backend/matchmakingSSE", { withCredentials: true });
    es.onmessage = (e) => {
      if (e.data === "ping") { // ignore
        return;
      }
      if (e.data === "match") {
        console.log("MATCH!");
        es.close(); // one-shot after match
      } else {
        console.log("msg:", e.data);
      }

    };
  }

</script>

<div class="center">
	<button class="rainbow" on:click={findMatch}>Find Match</button>
</div>

<style>

	.center {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%; /* inherits available height from parent */
	}

  .rainbow {
    background-color: red;
    width: 90px;
    height: 30px;
    border-radius: 12px;
    z-index: 1;
    position: relative;
    overflow: hidden;
    cursor:pointer;
    border-width: 0;

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

  }

  .rainbow::after {
    content: "Find Match";

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

  .rainbow:hover::before{
    animation: spin 1.5s infinite linear;
  }

  @keyframes spin {
    to{
      transform: rotate(360deg);
    }
  }

</style>

