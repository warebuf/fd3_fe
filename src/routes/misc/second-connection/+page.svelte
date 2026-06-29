<p>Another tab is open, therefore this tab closed</p>

<style>
    p {
        text-align: center;
    }
</style>

<script lang="ts">
    import { onMount } from "svelte";

    onMount(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                window.location.href = "/";
            }
        };

        document.addEventListener("keydown", handler);

        return () => {
            document.removeEventListener("keydown", handler);
        };
    });
</script>