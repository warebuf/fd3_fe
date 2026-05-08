
import { get } from "svelte/store";
import type { GameState, Card, Chain, ChainStep } from "../engine/gameState"
import { ChainStepType, Phase } from "../engine/gameState"
import type { CardIDToChainStepIndex } from "../engine/buildRecurringMap"
import type { coordinate } from "./cardCoordinates"
import { serverClockOffset, ping } from "../networking/ping";

export const CARD_W = 56;
export const CARD_H = 80;
const CARD_RADIUS = 6;
export const CARD_GAP = 8;
const ZONE_PAD = 8;
export const ZONE_H = CARD_H + ZONE_PAD * 2;
const CARD_COLOR = "#2C2C2A";
const CARD_BORDER = "#6E6D69";
const TEXT_COLOR = "#D3D1C7";
const SUBTEXT_COLOR = "#888780";
const DIVIDER_COLOR = "#6F6E68";

const CROSSHAIR_COLOR = "#D3D1C7";
const CROSSHAIR_BORDER = "rgba(211,209,199,0.5)";
const CROSSHAIR_BG = "rgba(211,209,199,0.06)";

export const PCARD_W = 120;
export const PCARD_H = 100;
const P_PAD_W = 8;
const P_PAD_H = 6;

function roundRectTop( ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function roundRect( ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const w = PCARD_W;
  const h = PCARD_H;
  const ARM = 12;
  const GAP = 2;
  const x0 = x - GAP;
  const y0 = y - GAP;
  const x1 = x + w + GAP;
  const y1 = y + h + GAP;

  ctx.save();
  ctx.strokeStyle = CROSSHAIR_COLOR;
  ctx.lineWidth = 0.5;
  ctx.lineCap = "square";
  ctx.beginPath();

  // top-left
  ctx.moveTo(x0, y0 + ARM);
  ctx.lineTo(x0, y0);
  ctx.lineTo(x0 + ARM, y0);

  // top-right
  ctx.moveTo(x1 - ARM, y0);
  ctx.lineTo(x1, y0);
  ctx.lineTo(x1, y0 + ARM);

  // bottom-left
  ctx.moveTo(x0, y1 - ARM);
  ctx.lineTo(x0, y1);
  ctx.lineTo(x0 + ARM, y1);

  // bottom-right
  ctx.moveTo(x1 - ARM, y1);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1, y1 - ARM);

  ctx.stroke();
  ctx.restore();
}


const RESERVES_SIZE = 70;

function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxY: number): number {
    if (!text) return y;
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let i = 0; i < words.length; i++) {
        const testLine = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(testLine).width > maxWidth && line !== '') {
            if (currentY > maxY) break;
            ctx.fillText(line, x, currentY);
            line = words[i];
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    if (line && currentY <= maxY) {
        ctx.fillText(line, x, currentY);
        currentY += lineHeight;
    }
    return currentY;
}

function drawFieldCard( ctx: CanvasRenderingContext2D, x: number, y: number, card: Card, recurringStep?: ChainStep, faceDown?: boolean, selected?: boolean ) {
    ctx.save();

    // adjust for blurry half pixel borders
    x = Math.round(x) + 0.5;
    y = Math.round(y) + 0.5;

    if (faceDown) {
        roundRect(ctx, x, y, PCARD_W, PCARD_H, CARD_RADIUS);
        ctx.fillStyle = "#141414";
        ctx.fill();
        ctx.strokeStyle = CARD_BORDER;
        ctx.lineWidth = 0.5;
        roundRect(ctx, x, y, PCARD_W, PCARD_H, CARD_RADIUS);
        ctx.stroke();
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = "bold italic 9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("FD", x + PCARD_W / 2, y + PCARD_H / 2);
        ctx.restore();
        return;
    }

    // draw card background
    roundRect(ctx, x, y, PCARD_W, PCARD_H, CARD_RADIUS);
    ctx.fillStyle = selected ? CROSSHAIR_BG : CARD_COLOR;
    ctx.fill();

    // draw the border
    ctx.strokeStyle = selected ? CROSSHAIR_BORDER : CARD_BORDER;
    ctx.lineWidth = selected ? 1 : 0.5;
    roundRect(ctx, x, y, PCARD_W, PCARD_H, CARD_RADIUS);
    ctx.stroke();

    // draw title
    let tx = x + P_PAD_W;
    let ty = y + P_PAD_H + 11; // 11 pixel font
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(card.Name, tx, ty);

    // draw card type
    ty += 12;
    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.font = "9px sans-serif";
    let cardType = "";
    if(card.Type === 1) {
        cardType = "Permanent";
    } else if(card.Type === 3) {
        cardType = "Spell";
    }
    ctx.fillText(cardType, tx, ty);

    const contentBot = y + PCARD_H - P_PAD_H - 12 - P_PAD_H; // top of footer divider

    // draw description
    const divY = ty + 8;
    let descBottom = divY + 10;
    if (card.Description) {
        ctx.fillStyle = SUBTEXT_COLOR;
        ctx.font = "italic 9px sans-serif";
        ctx.textBaseline = "alphabetic";
        descBottom = drawWrappedText(ctx, card.Description, tx, divY + 10, PCARD_W - P_PAD_W * 2, 11, contentBot - 4);
    }

    // draw recurring ability progress below description
    if (recurringStep) {
        const barX = x + P_PAD_W;
        const contentBot = y + PCARD_H - P_PAD_H - 12 - P_PAD_H; // top of footer divider
        const barY = contentBot - 6 - P_PAD_H; // 6 = BLOCK_H, pinned near footer to leave room for description
        drawBlockProgress(ctx, barX, barY, PCARD_W - P_PAD_W * 2, recurringStep.StartTime, recurringStep.OccurTime);
    }

    // determine status
    let statusColor = "";
    let statusText = "";
    statusText = "Available";
    statusColor = "#3A8F5A";
    //statusText = "Pending Summon";
    //statusColor = "#BFA43A";

    // draw status at footer
    const statusX = x + (PCARD_W/2);
    const statusY = y + PCARD_H - P_PAD_H;
    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center"
    ctx.textBaseline = "bottom";
    ctx.fillText(statusText, statusX, statusY);

    // draw status indicator
    const textW = ctx.measureText(statusText).width;
    const indicatorX = statusX - (textW/2) - 8;
    const indicatorY = statusY - 6;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 2, 0, Math.PI * 2);
    ctx.fillStyle = statusColor;
    ctx.fill();

    // draw footer divider
    const lineY = statusY - P_PAD_H - 12;
    const lineX1 = x + P_PAD_W;
    const lineX2 = x + PCARD_W - P_PAD_W;
    ctx.beginPath();
    ctx.moveTo(lineX1, lineY);
    ctx.lineTo(lineX2, lineY);
    ctx.strokeStyle = DIVIDER_COLOR;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // draw hp (bottom-left) and cost (top-right)
    const footerH = y + PCARD_H - lineY;
    const boxY = lineY + (footerH - STAT_BOX_H) / 2;
    drawStatBox(ctx, x + PCARD_W - 4 - STAT_BOX_W, y + 4, card.Cost, "#0E1E30", "#7AADDF");
    drawStatBox(ctx, x + PCARD_W - 4 - STAT_BOX_W, y + PCARD_H - 4 - STAT_BOX_H, card.HP, "#2E0E0E", "#D46B6B");

    if (selected) drawCrosshair(ctx, x, y);

    if (!faceDown && card.AutoSummon > 0) {
        const badgeR = 10;
        const badgeX = x - badgeR * 0.3;
        const badgeY = y - badgeR * 0.3;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
        ctx.fillStyle = "#F5C518";
        ctx.fill();
        ctx.fillStyle = "#1a1a1a";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(card.AutoSummon), badgeX, badgeY);
    }

    ctx.restore();
}

function drawField( ctx: CanvasRenderingContext2D, y: number, cards: Card[], field: number[], canvasWidth: number, recurringMap: Map<number, CardIDToChainStepIndex>, chains: Chain[]): void {
    const n = field.length;
    if (n === 0) return;

    // total width of all cards + gaps
    const totalW = n * PCARD_W + (n - 1) * CARD_GAP;

    // center within canvas
    const startX = (canvasWidth - totalW) / 2;

    for (let i = 0; i < n; i++) {
        const card = cards[field[i]];
        const cardX = startX + i * (PCARD_W + CARD_GAP);
        const loc = recurringMap.get(card.CardID);
        const recurringStep = loc
            ? chains.find(c => c.ChainID === loc.ChainID)?.ChainSteps[loc.Index]
            : undefined;
        drawFieldCard(ctx, cardX, y, card, recurringStep);
    }
}

// returns how much to increment y by
function drawReactionZone( ctx: CanvasRenderingContext2D, x:number, y: number, chains: Chain[], cards: Card[] ) : number {

    const margin = 10;
    const height = 300;

    // draw the reaction chain
    const centerX = ctx.canvas.clientWidth / 2;
    const centerY = y + (height / 2);
    drawReactionChains( ctx, centerX, centerY, chains, cards );

    return height + (2*margin);
}


function drawReactionChains( ctx: CanvasRenderingContext2D, centerX: number, centerY: number, chains: Chain[], cards: Card[] ) {

    if (chains.length <= 0) { return; }

    const itemWidth = PCARD_W;
    const itemHeight = PCARD_H;
    const itemMargin = 6;
    const chainPad_W = 10;
    const chainPad_H = 10;
    const titleHeight = 20;
    const chainMargin = 16;

    const chainContainerW = itemWidth + 2 * chainPad_W;

    const drawableChains = chains
        .filter(c => c.ChainSteps.length > 0)
        .filter(c => !(c.ChainSteps.length === 1 && c.ChainSteps[0].Type === ChainStepType.Other))
        .map(c => ({ chain: c, visibleSteps: c.ChainSteps.filter(s => s.Type !== ChainStepType.Recurring) }))
        .filter(({ visibleSteps }) => visibleSteps.length > 0);

    if (drawableChains.length === 0) { return; }

    const totalWidth = drawableChains.length * chainContainerW + (drawableChains.length - 1) * chainMargin;
    const groupStartX = centerX - totalWidth / 2;

    for (let i = 0; i < drawableChains.length; i++) {
        const { chain, visibleSteps } = drawableChains[i];

        const totHeight = visibleSteps.length * itemHeight + itemMargin * (visibleSteps.length - 1);
        const chainX = groupStartX + i * (chainContainerW + chainMargin);
        const chainY = centerY - totHeight / 2;

        // container title background
        roundRectTop(ctx, chainX, chainY - chainPad_H - titleHeight, chainContainerW, titleHeight, CARD_RADIUS);
        ctx.fillStyle = "#383735";
        ctx.fill();

        // container title text
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = "10px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("Chain ", chainX + 6, chainY - chainPad_H - titleHeight / 2 + 1);

        // container border
        roundRect(ctx, chainX + 0.5, chainY - chainPad_H - titleHeight + 0.5, chainContainerW, totHeight + 2 * chainPad_H + titleHeight, CARD_RADIUS);
        ctx.strokeStyle = CARD_BORDER;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // entries
        for (let j = 0; j < visibleSteps.length; j++) {
            const entry = visibleSteps[j];
            const entryX = chainX + chainPad_W;
            const entryY = chainY + j * (itemHeight + itemMargin);

            const card = cards.find(c => c.CardID === entry.CardID);
            if (card) {
                drawFieldCard(ctx, entryX, entryY, card, entry);
            }
        }
    }

}

function drawHand( ctx: CanvasRenderingContext2D, x: number, y: number, w: number, handOrder: number[], cards: Card[], handCoords: coordinate[], faceDown: boolean, selectedIndex: number ) {
    for (let i = 0; i < handOrder.length; i++) {
        drawFieldCard( ctx, handCoords[i].x, handCoords[i].y, cards[handOrder[i]], undefined, faceDown, selectedIndex === handOrder[i] );
    }
}

const STAT_BOX_W = 22;
const STAT_BOX_H = 14;
const STAT_BOX_R = 3;

function drawStatBox(ctx: CanvasRenderingContext2D, x: number, y: number, value: number, bgColor: string, textColor: string) {
    roundRect(ctx, x, y, STAT_BOX_W, STAT_BOX_H, STAT_BOX_R);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.fillStyle = textColor;
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(value), x + STAT_BOX_W / 2, y + STAT_BOX_H / 2);
}

function drawBlockProgress( ctx: CanvasRenderingContext2D, x: number, y: number, w: number, startMs: number, endMs: number ) {
    const NUM_BLOCKS = 8;
    const BLOCK_H = 6;
    const GAP = 2;
    const LABEL_W = 44;
    const blocksW = w - GAP - LABEL_W;
    const blockW = (blocksW - GAP * (NUM_BLOCKS - 1)) / NUM_BLOCKS;
    const clockOffset = get(serverClockOffset);
    const now = Date.now() + clockOffset; // convert client time to server time for comparison
    const progress = Math.min(Math.max((now - startMs) / (endMs - startMs), 0), 1);
    const filled = Math.floor(progress * NUM_BLOCKS);
    const remainingMs = Math.max(endMs - now, 0);
    const label = (remainingMs / 1000).toFixed(1);

    for (let i = 0; i < NUM_BLOCKS; i++) {
        const bx = x + i * (blockW + GAP);
        ctx.fillStyle = i < filled ? TEXT_COLOR : CARD_BORDER;
        ctx.fillRect(Math.round(bx), y, Math.floor(blockW), BLOCK_H);
    }

    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.font = "8px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w, y + BLOCK_H / 2);

}


function drawInfoPanel(ctx: CanvasRenderingContext2D, state: GameState, opponentIndex: number, userIndex: number) {
    const x = 6;
    let y = 6;
    const LINE_H = 14;

    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.fillText(`Phase ${state.Phase}`, x, y);
    y += LINE_H;
    ctx.fillText(`${get(ping)} ms`, x, y);
    y += LINE_H * 2;

    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.fillText("Opponent:", x, y);
    y += LINE_H;
    ctx.fillStyle = "#D46B6B";
    ctx.fillText(`HP ${state.Structures[opponentIndex]?.HP ?? 0}`, x, y);
    y += LINE_H;
    ctx.fillStyle = "#7AADDF";
    ctx.fillText(`Mana ${state.Mana[opponentIndex] ?? 0}`, x, y);
    y += LINE_H;
    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.fillText(`Reserves ${state.Deck[opponentIndex].length}`, x, y);
    y += LINE_H;
    ctx.fillText(`Graveyard ${state.Grave[opponentIndex].length}`, x, y);
    if (state.Phase === Phase.BoardSetup) {
        y += LINE_H;
        const oppReady = state.Ready[opponentIndex] ?? false;
        ctx.fillStyle = oppReady ? "#3A8F5A" : SUBTEXT_COLOR;
        ctx.fillText(oppReady ? "Ready" : "Not ready", x, y);
    }
    y += LINE_H * 2;

    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.fillText("You:", x, y);
    y += LINE_H;
    ctx.fillStyle = "#D46B6B";
    ctx.fillText(`HP ${state.Structures[userIndex]?.HP ?? 0}`, x, y);
    y += LINE_H;
    ctx.fillStyle = "#7AADDF";
    ctx.fillText(`Mana ${state.Mana[userIndex] ?? 0}`, x, y);
    y += LINE_H;
    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.fillText(`Reserves ${state.Deck[userIndex].length}`, x, y);
    y += LINE_H;
    ctx.fillText(`Graveyard ${state.Grave[userIndex].length}`, x, y);
    if (state.Phase === Phase.BoardSetup) {
        y += LINE_H;
        const userReady = state.Ready[userIndex] ?? false;
        ctx.fillStyle = userReady ? "#3A8F5A" : SUBTEXT_COLOR;
        ctx.fillText(userReady ? "Ready" : "Not ready", x, y);
    }
}

export function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, userIndex: number, handOrder: number[][], handCoords: coordinate[][], selectedIndex: number, recurringMap: Map<number, CardIDToChainStepIndex>) {
    const W = ctx.canvas.clientWidth;
    const H = ctx.canvas.clientHeight;
    const opponentIndex = userIndex === 0 ? 1 : 0;

    // draw dot grid
    if(false){ 
        const spacing = 8;
        const dotRadius = 0.5;
        const dotColor = "white";

        const cols = Math.ceil(W / spacing);
        const rows = Math.ceil(H / spacing);
        
        ctx.fillStyle = dotColor;
        for (let row = 0; row <= rows; row++) {
            for (let col = 0; col <= cols; col++) {
            const x = col * spacing;
            const y = row * spacing;
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
            }
        }
    }

    const LEFT_X = 16;
    const RIGHT_X = W - RESERVES_SIZE - LEFT_X;
    const ZONE_X = LEFT_X;
    const ZONE_W = RIGHT_X - CARD_GAP - LEFT_X;

    let y = 16;

    // Opponent hand
    drawHand(ctx, ZONE_X, y, ZONE_W, handOrder[opponentIndex] ?? [], state.Cards, handCoords[opponentIndex] ?? [], true, selectedIndex); // face down
    y += ZONE_H + 16;

    if (state.Phase !== Phase.BoardSetup) {
        // Opponent field
        drawField(ctx, y, state.Cards, state.Field[opponentIndex], W, recurringMap, state.ReactionPQ.Items);
        y += ZONE_H + 16;

        // Chain Zone
        y += drawReactionZone(ctx, ZONE_X, y, state.ReactionPQ.Items, state.Cards);

        // Player field
        drawField(ctx, y, state.Cards, state.Field[userIndex], W, recurringMap, state.ReactionPQ.Items);
        y += ZONE_H + 16;
    }

    // Player hand
    drawHand(ctx, ZONE_X, y, ZONE_W, handOrder[userIndex] ?? [], state.Cards, handCoords[userIndex] ?? [], false, selectedIndex); // face up

    drawInfoPanel(ctx, state, opponentIndex, userIndex);
}
