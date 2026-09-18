<script lang="ts">
    import { onMount } from 'svelte';
    import type { Card } from '../engine/gameState';
    import { drawFieldCard, CARD_W, CARD_H, CARD_GAP } from './drawBoard';

    export let cards: Card[];
    export let cardIDs: number[];
    export let title: string;
    export let onClose: () => void;

    let bodyEl: HTMLDivElement;
    let canvasEl: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | undefined;

    function render() {
        if (!ctx || !bodyEl) return;

        const dpr = window.devicePixelRatio || 1;
        const width = bodyEl.clientWidth;
        const cols = Math.max(1, Math.floor((width + CARD_GAP) / (CARD_W + CARD_GAP)));
        const rows = cardIDs.length === 0 ? 0 : Math.ceil(cardIDs.length / cols);
        const height = rows === 0 ? 0 : rows * (CARD_H + CARD_GAP) - CARD_GAP;

        canvasEl.style.width = width + 'px';
        canvasEl.style.height = height + 'px';
        canvasEl.width = Math.max(1, Math.round(width * dpr));
        canvasEl.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        cardIDs.forEach((cardID, i) => {
            const card = cards[cardID];
            if (!card) return;
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * (CARD_W + CARD_GAP);
            const y = row * (CARD_H + CARD_GAP);
            drawFieldCard(ctx!, x, y, card, 0, false, false, false);
        });
    }

    let resizeObserver: ResizeObserver;

    onMount(() => {
        ctx = canvasEl.getContext('2d')!;
        render();

        resizeObserver = new ResizeObserver(() => render());
        resizeObserver.observe(bodyEl);

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('keydown', onKeyDown);
        };
    });

    // redraw whenever the viewed zone's contents change
    $: if (ctx) { cardIDs; render(); }
</script>

<div class="backdrop" role="presentation" on:click={onClose} on:keydown={(e) => e.key === 'Escape' && onClose()}>
    <div class="panel" role="dialog" aria-modal="true" aria-label={title} on:click|stopPropagation>
        <div class="panel-header">
            <span class="panel-title">{title} ({cardIDs.length})</span>
            <button class="close-btn" on:click={onClose}>✕</button>
        </div>
        <div class="panel-body" bind:this={bodyEl}>
            {#if cardIDs.length === 0}
                <div class="empty">Empty</div>
            {/if}
            <canvas bind:this={canvasEl}></canvas>
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
        width: min(900px, 92%);
        max-height: 80%;
        display: flex;
        flex-direction: column;
        background: #1a1a1a;
        border: 1px solid #3a3a38;
        border-radius: 6px;
        overflow: hidden;
    }

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        border-bottom: 1px solid #3a3a38;
        flex-shrink: 0;
    }

    .panel-title {
        color: #D3D1C7;
        font-size: 13px;
        font-family: sans-serif;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: #888780;
        font-size: 14px;
        cursor: pointer;
        line-height: 1;
        padding: 4px;
    }

    .close-btn:hover {
        color: #D3D1C7;
    }

    .panel-body {
        overflow-y: auto;
        padding: 14px;
        position: relative;
    }

    .empty {
        color: #888780;
        font-size: 12px;
        font-family: sans-serif;
        text-align: center;
        padding: 20px 0;
    }
</style>
