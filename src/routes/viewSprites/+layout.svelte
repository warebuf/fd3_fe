<slot />

<style>
  /* Override the root layout only for /play */
  :global(.content) {
    display: flex;     /* let children (the canvas wrapper) flex */
	flex-direction: column;
  }
</style>