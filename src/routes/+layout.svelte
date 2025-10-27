<script>
	import '/src/app.css';
</script>
  
<div class="shell">
	<header class="topbar">
		<p class="logo">Fighting Demons № 1</p>
		<nav>
			<a href="/play">Play</a>
		</nav>
	</header>
  
	<div class="main">
	  <div class="content">
		<slot />
	  </div>
	  <!-- <aside class="chatbox">
		<p>chat</p>		
	  </aside> -->
	</div>
</div>
  
<style>

	/* own the viewport height so we can reliably fill the screen, stacks the top bar and content */
	.shell {
		height: 100dvh;             
		display: flex;
		flex-direction: column;
	}

	.topbar {
		background-color: black;
		display: grid; 
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
	}

	.logo {
		font-size: 12px;
		margin: 0;
		margin-left: 6px;
	}
	
	nav {   
		text-align: center;
	}

	nav a {
	  	color: white;              
	  	text-decoration: none;
	  	font-size: 12px;
	}

	nav a:hover {
	  	text-decoration: underline;
	}

	.main {
		flex: 1;
		min-height: 0;               /* allow children to shrink so we can scroll u/d */
		min-width: 0;                /* allow children to shrink so we can scroll l/r */
		display: flex;              
		flex-direction: row;         /* center children + chatbox side-by-side */
	}

	.content {
		flex: 1;
		min-height: 0;
		min-width: 0;
		overflow: auto;            /* allow scrolling */
		overflow-wrap: anywhere;   /* modern, safest, break long strings */
		word-break: break-word;    /* older fallback */

		background: #222;
	}

	.chatbox {
		flex: 0 0 320px;            /* fixed right sidebar */
		background: #1b1b1b; color: #fff;
		overflow: auto;             /* chat list can scroll independently */
		overflow-wrap: anywhere;   /* modern, safest */
		word-break: break-word;    /* older fallback */
	}
  
</style>