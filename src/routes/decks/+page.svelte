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

    type SavedDeck = {
        id: string;
        name: string;
        deck: number[];
        structNo: number;
        createdAt: string;
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

    let sharedDecks: SavedDeck[] = [];
    let sharedDecksError = '';
    let newDeckName = '';
    let publishing = false;
    let publishError = '';

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

    async function loadSharedDecks() {
        try {
            const res = await fetch('/backend/savedDecks');
            if (!res.ok) throw new Error('failed to load shared decks');
            sharedDecks = (await res.json()) ?? [];
        } catch (e) {
            sharedDecksError = 'Could not load the shared deck list.';
            console.error(e);
        }
    }

    async function publishDeck() {
        if (publishing || deckTotal === 0 || structNo === null) return;

        publishError = '';
        publishing = true;
        try {
            const res = await fetch('/backend/savedDecks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newDeckName, deck: flatDeck(), structNo }),
            });
            if (!res.ok) {
                publishError = await res.text() || 'failed to save deck';
                return;
            }
            const entry = (await res.json()) as SavedDeck;
            sharedDecks = [...sharedDecks, entry];
            newDeckName = '';
        } catch (e) {
            publishError = 'Could not reach the backend.';
            console.error(e);
        } finally {
            publishing = false;
        }
    }

    function loadSharedDeck(entry: SavedDeck) {
        if (deckTotal > 0 && !confirm(`Replace your current deck with "${entry.name}"?`)) return;

        const counts: Record<number, number> = {};
        for (const defNo of entry.deck) {
            counts[defNo] = (counts[defNo] ?? 0) + 1;
        }
        deckCounts = counts;
        structNo = entry.structNo;
        saved = false;
    }

    onMount(async () => {
        loadSharedDecks();

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
            <div class="table-wrap">
                <table class="catalog-table">
                    <thead>
                        <tr>
                            <th class="col-name">Name</th>
                            <th class="col-type">Type</th>
                            <th class="col-num">Cost</th>
                            <th class="col-num">HP</th>
                            <th class="col-keywords">Keywords</th>
                            <th class="col-desc">Description</th>
                            <th class="col-count">In Deck</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredCards as card (card.DefNo)}
                            {@const count = deckCounts[card.DefNo] ?? 0}
                            <tr class:in-deck={count > 0}>
                                <td class="col-name">{card.Name}</td>
                                <td class="col-type">{typeLabels[card.Type] ?? 'Card'}</td>
                                <td class="col-num mono">{card.Cost}</td>
                                <td class="col-num mono">{card.Type === CardType.Unit ? card.BaseHP : '—'}</td>
                                <td class="col-keywords">
                                    {#if card.Taunt}<span class="keyword">Taunt</span>{/if}
                                    {#if card.Bodyguard}<span class="keyword">Bodyguard</span>{/if}
                                </td>
                                <td class="col-desc">{card.Description}</td>
                                <td class="col-count">
                                    <div class="card-controls">
                                        <button class="count-btn" on:click={() => removeCard(card.DefNo)} disabled={count === 0}>−</button>
                                        <span class="count">{count} / {MAX_COPIES}</span>
                                        <button class="count-btn" on:click={() => addCard(card.DefNo)} disabled={count >= MAX_COPIES || deckTotal >= MAX_DECK_SIZE}>+</button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
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

        <div class="publish-row">
            <input
                class="deck-name-input"
                type="text"
                placeholder="Name this deck…"
                maxlength="60"
                bind:value={newDeckName}
                disabled={publishing}
            />
            <button
                class="publish-btn"
                on:click={publishDeck}
                disabled={publishing || deckTotal === 0 || !newDeckName.trim()}
            >
                {publishing ? 'Saving…' : 'Publish'}
            </button>
        </div>
        {#if publishError}<p class="status error">{publishError}</p>{/if}

        <a class="play-link" href="/play">Go to Play →</a>
    </aside>

    <aside class="sidebar shared-sidebar">
        <h2>Shared Decks</h2>
        <p class="shared-hint">Published by everyone. Click one to load it into the builder.</p>

        {#if sharedDecksError}
            <p class="status error">{sharedDecksError}</p>
        {:else if sharedDecks.length === 0}
            <p class="status">No decks published yet — be the first.</p>
        {:else}
            <div class="shared-deck-list">
                {#each [...sharedDecks].reverse() as entry (entry.id)}
                    <button class="shared-deck-row" on:click={() => loadSharedDeck(entry)}>
                        <span class="shared-deck-name">{entry.name}</span>
                        <span class="shared-deck-count">{entry.deck.length} cards</span>
                    </button>
                {/each}
            </div>
        {/if}
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

    .table-wrap {
        flex: 1;
        min-height: 0;
        overflow: auto;
        border: 1px solid #3a3a38;
        border-radius: 6px;
    }

    .catalog-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
    }

    .catalog-table thead th {
        position: sticky;
        top: 0;
        background: #1C1C1A;
        border-bottom: 1px solid #3a3a38;
        color: #888780;
        text-align: left;
        font-weight: normal;
        font-size: 11px;
        padding: 8px 10px;
        white-space: nowrap;
    }

    .catalog-table tbody tr {
        border-bottom: 1px solid #2a2a28;
    }

    .catalog-table tbody tr:hover {
        background: #23231f;
    }

    .catalog-table tbody tr.in-deck {
        background: #1c2419;
    }

    .catalog-table tbody tr.in-deck:hover {
        background: #223021;
    }

    .catalog-table td {
        padding: 7px 10px;
        vertical-align: middle;
        color: #D3D1C7;
    }

    .col-name {
        font-weight: bold;
        white-space: nowrap;
    }

    .col-type {
        color: #888780;
        white-space: nowrap;
    }

    .col-num {
        text-align: right;
        white-space: nowrap;
    }

    .mono {
        font-family: monospace;
        color: #7AADDF;
    }

    .col-keywords {
        white-space: nowrap;
    }

    .keyword {
        display: inline-block;
        background: #2C2C2A;
        border: 1px solid #6E6D69;
        border-radius: 3px;
        color: #888780;
        font-size: 10px;
        padding: 1px 6px;
        margin-right: 4px;
    }

    .col-desc {
        color: #888780;
        font-style: italic;
        min-width: 260px;
        line-height: 1.4;
    }

    .col-count {
        white-space: nowrap;
    }

    .card-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .count-btn {
        background: #1C1C1A;
        border: 1px solid #6E6D69;
        border-radius: 4px;
        color: #D3D1C7;
        width: 22px;
        height: 20px;
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
        min-width: 32px;
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

    .publish-row {
        display: flex;
        gap: 6px;
    }

    .deck-name-input {
        flex: 1;
        min-width: 0;
        background: #2C2C2A;
        border: 1px solid #6E6D69;
        border-radius: 4px;
        color: #D3D1C7;
        padding: 6px 8px;
        font-size: 12px;
    }

    .deck-name-input:disabled {
        opacity: 0.5;
    }

    .publish-btn {
        background: #24361F;
        border: 1px solid #3A8F5A;
        border-radius: 4px;
        color: #6abf6a;
        padding: 6px 10px;
        font-size: 11px;
        cursor: pointer;
        white-space: nowrap;
    }

    .publish-btn:disabled {
        opacity: 0.4;
        cursor: default;
    }

    .shared-sidebar {
        gap: 8px;
    }

    .shared-hint {
        font-size: 11px;
        color: #888780;
        margin: 0;
        line-height: 1.4;
    }

    .shared-deck-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow-y: auto;
    }

    .shared-deck-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        background: #2C2C2A;
        border: 1px solid #6E6D69;
        border-radius: 4px;
        color: #D3D1C7;
        padding: 7px 10px;
        font-size: 12px;
        text-align: left;
        cursor: pointer;
    }

    .shared-deck-row:hover {
        border-color: #F5A623;
        color: #F5A623;
    }

    .shared-deck-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .shared-deck-count {
        flex-shrink: 0;
        font-size: 11px;
        font-family: monospace;
        color: #888780;
    }
</style>
