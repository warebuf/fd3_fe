<div class="center">
	<button class="rainbow">Find Match</button>
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
    z-index: 0;
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

    display: flex;
    align-items: center;
    justify-content: center;

    content: "Find Match";
    color: white;
    position: absolute;
    background-color: black;
    z-index: 3;
    width: 98%;
    height: 95%;
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
