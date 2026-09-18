<script lang="ts">
    import { onMount } from 'svelte';
    import { CardType } from '../match/[id]/engine/gameState';

    type CardDef = {
        DefNo: number;
        Type: number;
        Name: string;
        Description: string;
        Archetype: number;
        Taunt: boolean;
        Bodyguard: boolean;
        IsToken: boolean;
        MaxCharges: number;
        BaseHP: number;
        Cost: number;
    };

    type StructureDef = {
        DefNo: number;
        Name: string;
        Description: string;
        BaseHP: number;
        DrawCost: number;
    };

    const MAX_COPIES = 3;
    const MAX_DECK_SIZE = 100;
    const DECK_STORAGE_KEY = 'fd3-deck';
    const STRUCT_STORAGE_KEY = 'fd3-structNo';

    const typeLabels: Record<number, string> = {
        [CardType.Structure]: 'Structure',
        [CardType.Unit]: 'Unit',
        [CardType.Trap]: 'Trap',
        [CardType.Continuous]: 'Continuous',
        [CardType.Equip]: 'Equip',
    };

    let cardDefs: CardDef[] = [];
    let structureDefs: StructureDef[] = [];
    let loading = true;
    let loadError = '';

    let deckCounts: Record<number, number> = {};
    let structNo: number | null = null;
    let search = '';
    let typeFilter: number | 'all' = 'all';
    let saved = false;
    let randomSize = 30;

    $: deckTotal = Object.values(deckCounts).reduce((sum, n) => sum + n, 0);
    $: buildableCards = cardDefs.filter(c => !c.IsToken);
    $: filteredCards = buildableCards.filter(c => {
        if (typeFilter !== 'all' && c.Type !== typeFilter) return false;
        if (search && !c.Name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });
    $: deckEntries = Object.entries(deckCounts)
        .map(([defNo, count]) => ({ defNo: Number(defNo), count, def: cardDefs.find(c => c.DefNo === Number(defNo)) }))
        .filter(e => e.count > 0)
        .sort((a, b) => (a.def?.Name ?? '').localeCompare(b.def?.Name ?? ''));

    function addCard(defNo: number) {
        const current = deckCounts[defNo] ?? 0;
        if (current >= MAX_COPIES || deckTotal >= MAX_DECK_SIZE) return;
        deckCounts = { ...deckCounts, [defNo]: current + 1 };
        saved = false;
    }

    function removeCard(defNo: number) {
        const current = deckCounts[defNo] ?? 0;
        if (current <= 0) return;
        const next = { ...deckCounts, [defNo]: current - 1 };
        if (next[defNo] === 0) delete next[defNo];
        deckCounts = next;
        saved = false;
    }

    function flatDeck(): number[] {
        const out: number[] = [];
        for (const [defNo, count] of Object.entries(deckCounts)) {
            for (let i = 0; i < count; i++) out.push(Number(defNo));
        }
        return out;
    }

    function saveDeck() {
        try {
            localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(flatDeck()));
            if (structNo !== null) localStorage.setItem(STRUCT_STORAGE_KEY, String(structNo));
        } catch {
            // ignore - private browsing, storage disabled, etc.
        }
        saved = true;
    }

    function clearDeck() {
        deckCounts = {};
        saved = false;
    }

    function randomDeck() {
        const pool = buildableCards.map(c => c.DefNo);
        if (pool.length === 0) return;

        const target = Math.max(0, Math.min(randomSize, MAX_DECK_SIZE, pool.length * MAX_COPIES));
        const counts: Record<number, number> = {};
        let total = 0;
        let guard = 0;
        while (total < target && guard < target * 20) {
            guard++;
            const defNo = pool[Math.floor(Math.random() * pool.length)];
            const current = counts[defNo] ?? 0;
            if (current >= MAX_COPIES) continue;
            counts[defNo] = current + 1;
            total++;
        }

        deckCounts = counts;
        if (structureDefs.length > 0) {
            structNo = structureDefs[Math.floor(Math.random() * structureDefs.length)].DefNo;
        }
        saved = false;
    }

    onMount(async () => {
        try {
            const [cardsRes, structsRes] = await Promise.all([
                fetch('/backend/cardDefs'),
                fetch('/backend/structureDefs'),
            ]);
            if (!cardsRes.ok || !structsRes.ok) throw new Error('failed to load catalog');
            cardDefs = await cardsRes.json();
            structureDefs = await structsRes.json();
            if (structureDefs.length > 0) structNo = structureDefs[0].DefNo;
        } catch (e) {
            loadError = 'Could not load the card catalog. Is the backend running?';
            console.error(e);
        } finally {
            loading = false;
        }

        try {
            const savedDeck = localStorage.getItem(DECK_STORAGE_KEY);
            if (savedDeck) {
                const counts: Record<number, number> = {};
                for (const defNo of JSON.parse(savedDeck) as number[]) {
                    counts[defNo] = (counts[defNo] ?? 0) + 1;
                }
                deckCounts = counts;
                saved = true;
            }
            const savedStruct = localStorage.getItem(STRUCT_STORAGE_KEY);
            if (savedStruct) structNo = Number(savedStruct);
        } catch {
            // ignore
        }
    });
</script>

<div class="page">
    <div class="catalog">
        <div class="toolbar">
            <input class="search" type="text" placeholder="Search cards…" bind:value={search} />
            <div class="type-filters">
                <button class:active={typeFilter === 'all'} on:click={() => typeFilter = 'all'}>All</button>
                {#each Object.entries(typeLabels) as [value, label]}
                    <button class:active={typeFilter === Number(value)} on:click={() => typeFilter = Number(value)}>{label}</button>
                {/each}
            </div>
        </div>

        {#if loading}
            <p class="status">Loading card catalog…</p>
        {:else if loadError}
            <p class="status error">{loadError}</p>
        {:else}
            <div class="grid">
                {#each filteredCards as card (card.DefNo)}
                    {@const count = deckCounts[card.DefNo] ?? 0}
                    <div class="card" class:in-deck={count > 0}>
                        <div class="card-top">
                            <span class="card-name">{card.Name}</span>
                            <span class="card-cost">{card.Cost}</span>
                        </div>
                        <div class="card-meta">
                            {typeLabels[card.Type] ?? 'Card'}
                            {#if card.Type === CardType.Unit} · {card.BaseHP} HP{/if}
                            {#if card.Taunt} · Taunt{/if}
                            {#if card.Bodyguard} · Bodyguard{/if}
                        </div>
                        <p class="card-desc">{card.Description}</p>
                        <div class="card-controls">
                            <button class="count-btn" on:click={() => removeCard(card.DefNo)} disabled={count === 0}>−</button>
                            <span class="count">{count} / {MAX_COPIES}</span>
                            <button class="count-btn" on:click={() => addCard(card.DefNo)} disabled={count >= MAX_COPIES || deckTotal >= MAX_DECK_SIZE}>+</button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <aside class="sidebar">
        <h2>Your Deck</h2>
        <div class="deck-total" class:over={deckTotal > MAX_DECK_SIZE}>{deckTotal} / {MAX_DECK_SIZE} cards</div>

        {#if structureDefs.length > 0}
            <label class="struct-picker">
                <span>Structure</span>
                <select bind:value={structNo}>
                    {#each structureDefs as s (s.DefNo)}
                        <option value={s.DefNo}>{s.Name}</option>
                    {/each}
                </select>
            </label>
        {/if}

        <div class="random-row">
            <input class="random-size" type="number" min="1" max={MAX_DECK_SIZE} bind:value={randomSize} />
            <button class="random-btn" on:click={randomDeck}>🎲 Random Deck</button>
        </div>

        <div class="deck-list">
            {#if deckEntries.length === 0}
                <p class="status">No cards yet — click + on a card to add it.</p>
            {/if}
            {#each deckEntries as entry (entry.defNo)}
                <div class="deck-row">
                    <span class="deck-row-name">{entry.def?.Name ?? `#${entry.defNo}`}</span>
                    <span class="deck-row-count">×{entry.count}</span>
                    <button class="mini-remove" on:click={() => removeCard(entry.defNo)}>−</button>
                </div>
            {/each}
        </div>

        <div class="actions">
            <button class="save-btn" on:click={saveDeck} disabled={deckTotal === 0}>{saved ? 'Saved ✓' : 'Save Deck'}</button>
            <button class="clear-btn" on:click={clearDeck} disabled={deckTotal === 0}>Clear</button>
        </div>
        <a class="play-link" href="/play">Go to Play →</a>
    </aside>
</div>

<style>
    .page {
        display: flex;
        gap: 16px;
        padding: 16px;
        height: 100%;
        box-sizing: border-box;
        color: #D3D1C7;
        font-family: sans-serif;
    }

    .catalog {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
    }

    .search {
        background: #2C2C2A;
        border: 1px solid #6E6D69;
        border-radius: 4px;
        color: #D3D1C7;
        padding: 6px 10px;
        font-size: 12px;
        min-width: 180px;
    }

    .type-filters {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }

    .type-filters button {
        background: #2C2C2A;
        border: 1px solid #6E6D69;
        border-radius: 4px;
        color: #888780;
        padding: 5px 10px;
        font-size: 11px;
        cursor: pointer;
    }

    .type-filters button.active {
        border-color: #F5A623;
        color: #F5A623;
        background: #2a2418;
    }

    .status {
        color: #888780;
        font-size: 12px;
    }

    .status.error {
        color: #D46B6B;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 10px;
        overflow-y: auto;
        padding-bottom: 8px;
    }

    .card {
        background: #2C2C2A;
        border: 1px solid #6E6D69;
        border-radius: 6px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .card.in-deck {
        border-color: #3A8F5A;
    }

    .card-top {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 8px;
    }

    .card-name {
        font-size: 13px;
        font-weight: bold;
        color: #D3D1C7;
    }

    .card-cost {
        font-size: 11px;
        font-family: monospace;
        color: #7AADDF;
        flex-shrink: 0;
    }

    .card-meta {
        font-size: 10px;
        color: #888780;
    }

    .card-desc {
        font-size: 11px;
        font-style: italic;
        color: #888780;
        margin: 0;
        line-height: 1.4;
        flex: 1;
    }

    .card-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 2px;
    }

    .count-btn {
        background: #1C1C1A;
        border: 1px solid #6E6D69;
        border-radius: 4px;
        color: #D3D1C7;
        width: 24px;
        height: 22px;
        font-size: 13px;
        cursor: pointer;
        line-height: 1;
    }

    .count-btn:disabled {
        opacity: 0.35;
        cursor: default;
    }

    .count {
        font-size: 11px;
        font-family: monospace;
        color: #888780;
        min-width: 34px;
        text-align: center;
    }

    .sidebar {
        flex: 0 0 260px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: #1C1C1A;
        border: 1px solid #3a3a38;
        border-radius: 6px;
        padding: 14px;
        overflow-y: auto;
    }

    .sidebar h2 {
        font-size: 13px;
        margin: 0;
        color: #D3D1C7;
    }

    .deck-total {
        font-size: 11px;
        font-family: monospace;
        color: #888780;
    }

    .deck-total.over {
        color: #D46B6B;
    }

    .struct-picker {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 11px;
        color: #888780;
    }

    .struct-picker select {
        background: #2C2C2A;
        border: 1px solid #6E6D69;
        border-radius: 4px;
        color: #D3D1C7;
        padding: 5px 6px;
        font-size: 12px;
    }

    .random-row {
        display: flex;
        gap: 6px;
    }

    .random-size {
        width: 56px;
        background: #2C2C2A;
        border: 1px solid #6E6D69;
        border-radius: 4px;
        color: #D3D1C7;
        padding: 5px 6px;
        font-size: 12px;
        font-family: monospace;
    }

    .random-btn {
        flex: 1;
        background: #2C2C2A;
        border: 1px solid #7AADDF;
        border-radius: 4px;
        color: #7AADDF;
        padding: 5px 0;
        font-size: 11px;
        cursor: pointer;
    }

    .random-btn:hover {
        background: #1c2733;
    }

    .deck-list {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .deck-row {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
    }

    .deck-row-name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .deck-row-count {
        color: #7AADDF;
        font-family: monospace;
    }

    .mini-remove {
        background: transparent;
        border: none;
        color: #888780;
        cursor: pointer;
        font-size: 12px;
        line-height: 1;
        padding: 2px 4px;
    }

    .mini-remove:hover {
        color: #D46B6B;
    }

    .actions {
        display: flex;
        gap: 8px;
    }

    .save-btn, .clear-btn {
        flex: 1;
        border-radius: 4px;
        padding: 7px 0;
        font-size: 11px;
        cursor: pointer;
    }

    .save-btn {
        background: #24361F;
        border: 1px solid #3A8F5A;
        color: #6abf6a;
    }

    .save-btn:disabled, .clear-btn:disabled {
        opacity: 0.4;
        cursor: default;
    }

    .clear-btn {
        background: #2C2C2A;
        border: 1px solid #6E6D69;
        color: #888780;
    }

    .play-link {
        text-align: center;
        color: #F5A623;
        font-size: 12px;
        text-decoration: none;
        padding-top: 4px;
    }

    .play-link:hover {
        text-decoration: underline;
    }
</style>
