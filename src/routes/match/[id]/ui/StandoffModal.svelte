<script lang="ts">
    export let myMana: number;
    export let alreadySealed: boolean; // true once our own bid is locked in for this auction
    export let onSubmit: (amount: number) => void;

    let amount = 0;

    // remembers what WE submitted, purely for local display - the shared game state
    // deliberately never echoes it back to us either, to stay consistent with how the
    // opponent's bid is represented (sealed but unknown until reveal)
    let submitted = false;
    let submittedAmount = 0;

    function submit() {
        const clamped = Math.max(0, Math.min(Math.floor(amount) || 0, myMana));
        submittedAmount = clamped;
        submitted = true;
        onSubmit(clamped);
    }
</script>

<div class="backdrop" role="presentation">
    <div class="panel" role="dialog" aria-modal="true" aria-label="Standoff">
        <div class="panel-header">
            <span class="panel-title">Standoff</span>
        </div>
        <div class="panel-body">
            {#if submitted || alreadySealed}
                <p class="waiting">
                    {#if submitted}
                        You bid <strong>{submittedAmount}</strong> mana.
                    {/if}
                    Waiting for the standoff to resolve&hellip;
                </p>
            {:else}
                <p class="hint">Both players secretly bid mana. The higher bidder forces the loser to discard a random card from their hand; both bids are spent either way.</p>

                <label class="field">
                    <span>Your bid (0&ndash;{myMana} mana)</span>
                    <input type="number" min="0" max={myMana} step="1" bind:value={amount} />
                </label>

                <button class="submit-btn" on:click={submit}>Seal Bid</button>
            {/if}
        </div>
    </div>
</div>

<style>
    .backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20;
    }

    .panel {
        width: min(420px, 92%);
        display: flex;
        flex-direction: column;
        background: #1a1a1a;
        border: 1px solid #3a3a38;
        border-radius: 6px;
        overflow: hidden;
    }

    .panel-header {
        padding: 10px 14px;
        border-bottom: 1px solid #3a3a38;
    }

    .panel-title {
        color: #D3D1C7;
        font-size: 13px;
        font-family: sans-serif;
        font-weight: bold;
    }

    .panel-body {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .hint {
        color: #888780;
        font-size: 11px;
        font-family: sans-serif;
        margin: 0;
        line-height: 1.4;
    }

    .waiting {
        color: #D3D1C7;
        font-size: 12px;
        font-family: sans-serif;
        margin: 0;
        line-height: 1.5;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 11px;
        color: #888780;
        font-family: sans-serif;
    }

    .field input {
        background: #2C2C2A;
        border: 1px solid #6E6D69;
        border-radius: 4px;
        color: #D3D1C7;
        padding: 6px 8px;
        font-size: 13px;
        font-family: monospace;
    }

    .submit-btn {
        background: #24361F;
        border: 1px solid #3A8F5A;
        border-radius: 4px;
        color: #6abf6a;
        padding: 8px 10px;
        font-size: 12px;
        font-family: sans-serif;
        cursor: pointer;
    }

    .submit-btn:hover {
        background: #2c4527;
    }
</style>
